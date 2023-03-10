//import {onlinePlayers, room} from './net/SocketServer';
import { Physics } from "phaser";

import { EVENTS_NAME, GameStatus } from "../../consts";

 
 
// 这里这里继承的不是 游戏类对象 Phaser.GameObjects.Sprite {  
 
export default class Player extends Physics.Arcade.Sprite {   //cursors = Phaser.Types.Input.Keyboard.CursorKeys
    id = ""
    hp = 100
    hpValue = null
    playerNickname = null 
   
    speed = 100 
    

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
 
        // Register cursors for player movement
        this.cursors = this.scene.input.keyboard.createCursorKeys();
        //this.spacebar = this.scene.input.keyboard.addKey(Phaser.Input.Keyboard.KeyCodes.SPACE);

        // PHYSICS  Player Offset 
        this.body.setSize(30, 30);
        this.body.setOffset(8, 0);
 
 console.log("----->>>>>>>>>>---",this.x,this.y )
        this.id = uuid
        this.hpValue = scene.add.text( 
            (this.x) -20 + 60, 
            (this.y - 40),
            this.hp +""
          );
 

        this.playerNickname = this.scene.add.text(
            this.x -20,
            (this.y - 40),
             'Player');

        this.scene.anims.create({
            key: "run",
            frames: this.scene.anims.generateFrameNames("a-king", {
              prefix: "run-",
              end: 7,
            }),
            frameRate: 8,
          });
      
          this.scene.anims.create({
            key: "attack",
            frames: this.scene.anims.generateFrameNames("a-king", {
              prefix: "attack-",
              end: 2,
            }),
            frameRate: 8,
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
        });
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
           // console.log("英雄 血量小于等于0 游戏结束")
            this.scene.game.events.emit(EVENTS_NAME.gameEnd, GameStatus.LOSE);
        }
    }

    showPlayerNickname() {
        this.playerNickname.x = this.x -20;
        this.playerNickname.y = (this.y - 40);
 
        this.hpValue.setPosition((this.x) -20 + 60, (this.y - 40));
        //this.hpValue.setOrigin(0.8, 0.5);

    }

    update() {
        //停止上一帧之前的任何运动
        this.body.setVelocity(0);
        // Show player nickname above player
        this.showPlayerNickname();

        if (this.cursors.up.isDown) {
            this.body.setVelocityY(-this.speed) 
            !this.anims.isPlaying && this.anims.play("run", true);
        }  
      
        if (this.cursors.left.isDown) {
            this.body.setVelocityX(-this.speed)
            this.checkFlip();
            this.body.setOffset(48, 15)
            !this.anims.isPlaying && this.anims.play("run", true)
        } 
        if (this.cursors.down.isDown) {
            this.body.velocity.y = 110;
            !this.anims.isPlaying && this.anims.play("run", true);
        }
    
        if (this.cursors.right.isDown) {
            this.body.setVelocityX(this.speed)
            this.checkFlip();
            this.body.setOffset(15, 15);
            !this.anims.isPlaying && this.anims.play("run", true);
        }
    
        if (this.cursors.space.isDown) {
            console.log(" 按攻击键后 执行")

            this.scene.game.events.emit(EVENTS_NAME.attack)
            this.anims.play("attack", true); // 攻击动画

        }
    }
 
}