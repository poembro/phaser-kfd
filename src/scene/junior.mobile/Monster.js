import Phaser from "phaser"
import { Physics } from "phaser"

import { Direction, EVENTS_NAME } from "../../consts";


const randomDirection = (exclude) => {
    let newDirection = Phaser.Math.Between(0, 3);
    while (newDirection === exclude) {
    newDirection = Phaser.Math.Between(0, 3);
    }

    return newDirection;
};


export default class Monster extends Physics.Arcade.Sprite {
    direction = Direction.RIGHT;
    moveEvent = Phaser.Time.TimerEvent
    target = null // 玩家
    AGRESSOR_RADIUS = 80
    attackHandler = null

    id = 0 // 怪物编号
    hp = 100
    hpValue = null
    nickname = null
    speed = 50 

    constructor(scene,worldLayer, x,y,target, uuid) {
        super(scene, x, y, "lizard", target);
       
        scene.add.existing(this);
        scene.physics.add.existing(this); 
        //玩家不能离开这个世界
        this.body.setCollideWorldBounds(true);
        scene.physics.add.collider(this, worldLayer)

        this.target = target 
        this.anims.play("lizard-idle");


        this.id = uuid 
        this.hpValue = scene.add.text((this.x) -20 ,  (this.y - 60), this.hp +"");
        this.nickname = this.scene.add.text( this.x -20, (this.y - 40),  '怪物');

        this.moveEvent = scene.time.addEvent({
            delay: 2000,
            callback: () => {
                this.direction = randomDirection(this.direction);
            },
            loop: true,
        });

        this.attackHandler = (e) => {
            let a = { x: parseInt(this.x), y: parseInt(this.y) } 
            let b = { x: parseInt(target.x), y: parseInt(target.y) }
            //console.log("------->", a, "----b",b," 结果",Phaser.Math.Distance.BetweenPoints(a,b)  )
            if ( Phaser.Math.Distance.BetweenPoints(a,b) < this.AGRESSOR_RADIUS) {
                this.getDamage(1);
            }
        }
         // EVENTS 监听事件     // 处理被宰之后的动作
         this.scene.game.events.on(EVENTS_NAME.attack, this.attackHandler, this);
         this.on("destroy", () => {
            // console.log("    这里被调用了this.on(destroy, () => {")
            this.scene.game.events.removeListener(EVENTS_NAME.attack, this.attackHandler)
        });
    }

    destroy() {
        this.moveEvent.destroy(); 
        super.destroy();

        this.nickname.destroy(); 
        this.hpValue.destroy(); 
    }

    setTarget(target) {
       this.target = target;
    }
    showNickname(x,y) {
        this.nickname.x = x -20;
        this.nickname.y = (y - 40);
 
        this.hpValue.setPosition((x) -20, (y - 60));
        //this.hpValue.setOrigin(0.8, 0.5);
    }

    preUpdate(t, dt) {
        super.preUpdate(t, dt)
        this.showNickname(this.x, this.y)

        if ( Phaser.Math.Distance.BetweenPoints( 
            { x: this.x, y: this.y }, 
            { x: this.target.x, y: this.target.y } ) < this.AGRESSOR_RADIUS) {
            this.body.setVelocityX(this.target.x - this.x);
            this.body.setVelocityY(this.target.y - this.y);
        } else {
          const speed = this.speed; 
          switch (this.direction) {
            case Direction.UP:
              this.body.setVelocity(0, -speed);
              break;
    
            case Direction.DOWN:
              this.body.setVelocity(0, speed);
              break;
    
            case Direction.LEFT:
              this.body.setVelocity(-speed, 0);
              break;
    
            case Direction.RIGHT:
              this.body.setVelocity(speed, 0);
              break;
          }
        }
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
            // console.log("敌人 血量小于等于0  应该停止怪物对象主体 然后消失 ") 
            this.disableBody(false, false)   // 停止怪物对象主体，但不消失
            this.destroy() 
            return
        }
        this.hpValue.setText(this.hp + "");
    }
}