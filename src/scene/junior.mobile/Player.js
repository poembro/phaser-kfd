import { Physics } from "phaser";
import { EVENTS_NAME, GameStatus } from "../../consts";

export default class Player extends Physics.Arcade.Sprite {   //cursors = Phaser.Types.Input.Keyboard.CursorKeys
    id = ""
    hp = 100
    hpValue = null
    nickname = null 
    speed = 100 
    autoIncrId = 0
    cursors= null

    SocketServer = null

    walkingIndex = 0 // 走路标识 防止走了一半中途打断
    constructor(scene, worldLayer, x, y, net) {
        super(scene, x, y, "king");
        
        scene.add.existing(this);
        scene.physics.add.existing(this); 
        scene.physics.add.collider(this, worldLayer);

        //玩家不能离开这个世界
        this.body.setCollideWorldBounds(true); 

        //this.body.setSize(30, 30)
        //this.body.setOffset(8, 0)

        this.SocketServer = net
        this.id = net.memberId
        this.hpValue = scene.add.text((this.x) -20 ,  (this.y - 60), this.hp +"");
        this.nickname = scene.add.text(this.x -20, (this.y - 40), net.nickname)

        scene.anims.create({key: "attack", frames: scene.anims.generateFrameNames("a-king", {prefix: "attack-",end: 2,}), frameRate: 8,}) 
        
        this.anims.create({
            key: 'left',
            frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }),
            frameRate: 10,
            repeat: -1
        });

        this.anims.create({
            key: 'turn',
            frames: [ { key: 'dude', frame: 4 } ],
            frameRate: 20
        });

        this.anims.create({
            key: 'right',
            frames: this.anims.generateFrameNumbers('dude', { start: 5, end: 8 }),
            frameRate: 10,
            repeat: -1
        });

        this.initEvents()
    }

    initEvents() {// 键盘事件
        this.cursors = this.scene.input.keyboard.createCursorKeys(); 
        this.scene.input.keyboard.addListener("keyup", (e)=>{ // keydown 表示按下事件
            this.walkingStop(true)
        }, this)
    }
 
    getDamage(value) { //得到伤害
        this.scene.tweens.add({
            targets: this,
            duration: 100,
            repeat: 3,
            yoyo: true,
            alpha: 0.5,
            onStart: () => {
                if (value) {
                    this.hp = this.hp - value;
                }
            },
            onComplete: () => {
                //console.log("自己 getDamage this.setAlpha(1) ")
               this.setAlpha(1);
            },
        })

        this.hpValue.setText(this.hp + "")
        if (this.hp <= 0) {
           // console.log("英雄 血量小于等于0 游戏结束")
            this.scene.game.events.emit(EVENTS_NAME.gameEnd, {status:GameStatus.LOSE,scene :"JuniorScene" });
        }
    }

    showNickname(x,y) {
        this.nickname.x = x -20;
        this.nickname.y = (y - 40);

        this.hpValue.setPosition((x) -20, (y - 60));
        //this.hpValue.setOrigin(0.8, 0.5);
    }
    walkingAnims = []
    addWalkingAnims(data){
        if (this.walkingIndex == data.walkingIndex) this.walkingAnims.push(data)
    }
    walkingIndexAdd() {
        this.walkingAnims = []
        return this.walkingIndex++;
    }
    update() {
        let isPush = false // 是否需要上报
        this.autoIncrId++
        if (this.autoIncrId > 1000000000) {
            this.autoIncrId = 0
        }

        this.body.setVelocity(0); // 暂停运动速度
        this.showNickname(this.x, this.y) 

        if (this.walkingAnims.length > 0 ) { // 播放寻路的地址
            let tmpdata = this.walkingAnims.shift() 

            this.netEventHandle(tmpdata)
            return
        }

        if (this.cursors.up.isDown) {
            this.body.setVelocityY(-this.speed) 
            this.anims.play("turn", true);

            isPush = true
        }  else if  (this.cursors.down.isDown) {
            this.body.velocity.y = 110;
            this.anims.play("turn", true);

            isPush = true
        } else if (this.cursors.left.isDown) {
            this.body.setVelocityX(-this.speed)
            this.anims.play("left", true) 

            isPush = true
        } else if (this.cursors.right.isDown) {
            this.body.setVelocityX(this.speed)
            this.anims.play("right", true); 
            isPush = true
        } else if (this.cursors.space.isDown) {
            if (this.autoIncrId % 4 == 0) {
                this.attackHandle(true)
            }
        }
        
        if (isPush){
            if (this.autoIncrId % 4 == 0) {
                this.SocketServer.send({
                    event: "PLAYER_MOVED", 
                    x: this.x,
                    y: this.y
                })
            }
        }
    }
    
    // isPush 加完血是否需要上报
    // 服务端广播 某个人捡到宝物 这里就可以复用上，但是不用继续上报(广播)
    addHP(isPush){
        this.hp = this.hp + 10
        this.hpValue.setText(this.hp + "")

        if (isPush) { // 自己攻击的上报至服务端
            this.SocketServer.send({
                event: "PLAYER_BROADCAST",
                typ:"chests_hp",
                memberId:this.id,
                hp: 10,
            })
        }
    }

    netEventHandle(data) {
        if (data.walkingIndex != this.walkingIndex) {
            return
        }
        this.walkingHandle(data.x, data.y) 
    }

    walkingHandle(x, y) {
        this.showNickname(x, y) 
        if ( x < this.x) {
            this.body.setVelocityX(-this.speed) // 负值使物体向左移动。
            this.body.setOffset(48, 15) //对象图片空白较大,用offset使角色进行偏移
            this.anims.play("left", true) 
            // console.log("----播放向左--")
        } else if ( x > this.x ) {
            this.body.setVelocityX(this.speed)//正值使物体向右移动, 值的绝对值越大，速度越快
            this.anims.play("right", true);
            // console.log("----播放向右--")
        } else if (y > this.y) {
            this.body.setVelocityY(110) // 注意设置该参数，网络同步时 该物体将不受控制 
            this.anims.play("turn", true) 
            // console.log("----播放向下--")
        } else if (y < this.y) {
            this.body.setVelocityY(-this.speed) 
            this.anims.play("turn", true);
            // console.log("----播放向上--")
        }

        if (x == y && y == 0) { // 暂停回正动画
            this.walkingStop(true)
        } else {
            this.setPosition(x, y)  //通用设置位置   
            //采用物理引擎帧动画 
            this.SocketServer.send({
                event: "PLAYER_MOVED", 
                x: x,
                y: y
            })
        }
        this.body.setVelocity(0) // 速度设置为0  
    }

    walkingStop(isPush){
        this.anims.play("turn", true);
        this.body.setVelocity(0) // 速度设置为0  
        if (isPush) {
            // 回正动画
            this.SocketServer.send({
                event: "PLAYER_BROADCAST", 
                memberId:this.id, 
                typ: "walking_stop",
            })
        }
    }
    attackHandle(isAttack) { 
        this.anims.play("attack", true); // 攻击动画 
        if (isAttack) {
            let net = this.SocketServer
            this.scene.game.events.emit(EVENTS_NAME.attack, (id, hp) => {
                // 自己攻击的上报 通知其他人界面的“我”加血了
                net.send({
                    event: "PLAYER_BROADCAST",
                    typ:"attack_hp",
                    memberId:id,
                    hp: hp,
                })
            })

            this.SocketServer.send({
                event: "PLAYER_BROADCAST",
                typ:"attack_action",
                memberId: this.id,
                x: this.x,
                y: this.y
            })
        }
    }
}
