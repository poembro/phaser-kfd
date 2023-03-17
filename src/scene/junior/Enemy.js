import Phaser from "phaser"
import { Physics } from "phaser"
import { Direction, EVENTS_NAME} from "../../consts";

const randomDirection = (exclude) => {
    let newDirection = Phaser.Math.Between(0, 3)
    while (newDirection === exclude) {
       newDirection = Phaser.Math.Between(0, 3)
    }

    return newDirection
}

export default class Enemy extends Physics.Arcade.Sprite {
    direction = Direction.RIGHT; // 方向
    target = null // 玩家
    AGRESSOR_RADIUS = 75
    attackHandler = null

    id = 0 // 怪物编号
    hp = 100
    hpValue = null
    enemyNickname = null
    speed = 50 
    
    autoIncrId = 0

    cursors= null
    constructor(scene, worldLayer, x, y,target, uuid) {
        super(scene, x, y, "king");
       
        scene.add.existing(this);
        scene.physics.add.existing(this); 
        //玩家不能离开这个世界
        this.body.setCollideWorldBounds(true);
        scene.physics.add.collider(this, worldLayer)

        //this.body.setSize(30, 30)
        //this.body.setOffset(8, 0)

        this.target = target 
        //this.anims.play("lizard-idle");


        this.id = uuid 
        this.hpValue = scene.add.text((this.x) -20 + 60, (this.y - 40),this.hp +"")
        this.enemyNickname = this.scene.add.text(this.x -20,(this.y - 40),'敌人');

        scene.anims.create({key: "attack",frames: scene.anims.generateFrameNames("a-king", {prefix: "attack-",end: 2,}), frameRate: 8,}) 
        
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
    showNickname() {
        this.enemyNickname.x = this.x -20;
        this.enemyNickname.y = (this.y - 40);
 
        this.hpValue.setPosition((this.x) -20 + 60, (this.y - 40));
        //this.hpValue.setOrigin(0.8, 0.5); 
    }
    walkingAnims = []
    addWalkingAnims(data){
        this.walkingAnims.push(data)
    }
    update() {
        this.autoIncrId++
        if (this.autoIncrId > 1000000000) {
            this.autoIncrId = 0
        }

        this.body.setVelocity(0); // 暂停运动速度
        this.showNickname(this.x, this.y) 

        if (this.walkingAnims.length > 0 && this.autoIncrId % 4 == 0) { // 播放寻路的地址
            let tmpdata = this.walkingAnims.shift() 
            this.netEventHandle(tmpdata)
            return
        }
    }
    initEvents() {
        // 键盘事件
        this.cursors = this.scene.input.keyboard.createCursorKeys(); 
        this.attackHandler = (fn) => {
            let a = { x: parseInt(this.x), y: parseInt(this.y) } 
            let b = { x: parseInt(this.target.x), y: parseInt(this.target.y) }
           //console.log("------fn->",fn,"----a-", a, "----b",b," 结果",Phaser.Math.Distance.BetweenPoints(a,b)  )
           
            if ( Phaser.Math.Distance.BetweenPoints(a,b) < this.AGRESSOR_RADIUS) {
                this.getDamage(1);
                // 上报血量减少
                if (fn) fn(this.id, 1)
            }
        }
        // EVENTS 监听事件     // 处理被宰之后的动作
        this.scene.game.events.on(EVENTS_NAME.attack, this.attackHandler, this);
        // 为给定事件添加侦听器。
        this.on("destroy", () => {
            console.log("    这里被调用了this.on(destroy, () => {")
            this.scene.game.events.removeListener(EVENTS_NAME.attack, this.attackHandler)
        }, this)
    }
    destroy() {
        super.destroy(); 
        this.enemyNickname.destroy(); 
        this.hpValue.destroy();
    }
    setTarget(target) {
       this.target = target;
    }
    addHP(){
        this.hp = this.hp + 10;
        this.hpValue.setText(this.hp +""); 
    }
    getHPValue() {
        return this.hp;
    }
    getDamage(value) {//得到伤害
        this.scene.tweens.add({
            targets: this,
            duration: 100,
            repeat: 3,
            yoyo: true,
            alpha: 0.5,
            onStart: () => {
                if (value) {
                    this.hp = this.hp - value;
                    //console.log(" 敌人 血量减少  ", value)
                }
            },
            onComplete: () => {
                //console.log("enemy 敌人 getDamage this.setAlpha(1) ")
                this.setAlpha(1);
            },
        });

        if (this.hp <= 0) {
            console.log("敌人 血量小于等于0  应该停止怪物对象主体 然后消失 ") 
            this.disableBody(false, false)   // 停止怪物对象主体，但不消失
            this.destroy() 
            return
        }
        this.hpValue.setText(this.hp + "")
    }

    netEventHandle(data) { 
        this.walkingHandle(data.x, data.y) 
    }

    walkingHandle(x, y) {
        this.showNickname(x, y) 
        if ( x < this.x) {
            this.body.setVelocityX(-this.speed) // 负值使物体向左移动。
            this.body.setOffset(48, 15) //对象图片空白较大,用offset使角色进行偏移
            this.anims.play("left", true) 
            console.log("----播放向左--")
        } else if ( x > this.x ) {
            this.body.setVelocityX(this.speed)//正值使物体向右移动, 值的绝对值越大，速度越快
            this.anims.play("right", true);
            console.log("----播放向右--")
        } else if (y > this.y) {
            this.body.setVelocityY(110) // 注意设置该参数，网络同步时 该物体将不受控制 
            this.anims.play("turn", true) 
            console.log("----播放向下--")
        } else if (y < this.y) {
            this.body.setVelocityY(-this.speed) 
            this.anims.play("turn", true);
            console.log("----播放向上--")
        }

        if (x == y && y == 0) { // 暂停回正动画
            this.anims.play("turn", true);
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