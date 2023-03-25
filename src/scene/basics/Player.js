import { Physics } from "phaser";
import { EVENTS_NAME, GameStatus } from "../../consts";

// 这里这里继承的不是 游戏类对象 Phaser.GameObjects.Sprite {  
 
export default class Player extends Physics.Arcade.Sprite {   //cursors = Phaser.Types.Input.Keyboard.CursorKeys
    id = ""
    hp = 100
    hpValue = null
    playerNickname = null 
   
    speed = 100 
    
    walkingIndex = 0 // 走路标识 防止走了一半中途打断

    constructor(scene, worldLayer, x, y, uuid) {
        super(scene, x, y, "king");
        
        this.scene.add.existing(this);
        scene.physics.add.existing(this); 
        //玩家不能离开这个世界
        this.body.setCollideWorldBounds(true);
    
        /**
        如果游戏对象已经有一个主体，这个方法将简单地将它添加回模拟中。
        可以指定主体是动态的还是静态的。动态物体可以通过速度和加速度运动。静态主体保持固定位置，因此能够使用优化的搜索树，使其成为静态元素(如关卡对象)的理想选择。你仍然可以与静态物体碰撞和重叠。
        通常，你不会直接调用这个方法，而是使用街机物理工厂中可用的辅助方法，例如:  */
        this.scene.physics.world.enableBody(this);
        this.scene.physics.add.collider(this, worldLayer);
 
        this.setDepth(1);
        this.setOrigin(0,0.5);

        // PHYSICS  Player Offset 
        this.body.setSize(30, 30);
        this.body.setOffset(8, 0);
 
        this.id = uuid
        this.hpValue = scene.add.text((this.x) -20 + 40,  (this.y - 40), this.hp +"" );
        this.playerNickname = this.scene.add.text( this.x -20, (this.y - 40), uuid+'');
        
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

      
        this.addHPHandler = (e) =>{
            // 加血
            this.hp = this.hp + 10;
            if (this.hpValue) this.hpValue.setText(this.hp + ""); 
        }
        // EVENTS 监听事件
        this.scene.game.events.on(EVENTS_NAME.addPh, this.addHPHandler, this);
        // 销毁事件        
        this.on("destroy", () => {
            console.log("    这里被调用了this.on(destroy, () => {")
            this.scene.game.events.removeListener(EVENTS_NAME.addPh, this.addHPHandler)
        })

        this.cursors = this.scene.input.keyboard.createCursorKeys();
 
        this.scene.input.keyboard.addListener("keyup", (e)=>{ // keydown 表示按下事件
            this.anims.play("turn", true);
        }, this)
    }

    addHP(){
        this.hp = this.hp + 10;
        this.hpValue.setText(this.hp + ""); 
    }
    getHPValue() {
        return this.hp;
    }

    checkFlip() {
        if (this.body.velocity.x < 0) {
          this.scaleX = -1;
        } else {
          this.scaleX = 1;
        }
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
        });

        this.hpValue.setText(this.hp + "");
        if (this.hp <= 0) {
            console.log("英雄 血量小于等于0 游戏结束")
            this.scene.game.events.emit(EVENTS_NAME.gameEnd, {status:GameStatus.LOSE,scene :"BasicsScene" });
        }
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
        this.autoIncrId = 4 
        

        this.body.setVelocity(0); // 暂停运动速度
        this.showNickname(this.x, this.y) 

        if (this.walkingAnims.length > 0) { // 播放寻路的地址
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
            this.attackHandle()
        }
    }
 
    showNickname(x,y) {
        this.playerNickname.x = x -20;
        this.playerNickname.y = (y - 40);
 
        this.hpValue.setPosition((x) -20 + 40, (y - 40));
        //this.hpValue.setOrigin(0.8, 0.5);
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
        }
        this.body.setVelocity(0) // 速度设置为0  
    }
    walkingStop(){
        this.anims.play("turn", true);
        this.body.setVelocity(0) // 速度设置为0   
    }
    attackHandle() { 
        this.anims.play("attack", true); // 攻击动画 
    }
}