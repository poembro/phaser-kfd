import  Player  from "./Player"; 
import Enemy  from "./Enemy"; 
import { EVENTS_NAME } from "./consts";
import {onlinePlayers, SocketServer} from './net/SocketServer';

 
export class GameScene extends Phaser.Scene {
     player = null
     bg = null
     map = null
     tileset = null
     wallsLayer  = null
     groundLayer  = null
     chests  = null
     enemies  = null 
     room = null
    constructor() {
        super("game-scene");
    }

    preload() {
        
    }

    create(props) {
        // 蜥蜴空闲
        this.anims.create({ 
            key: 'lizard-idle',
            frames: this.anims.generateFrameNames('lizard', { start: 0, end: 3, prefix: 'lizard_m_idle_anim_f', suffix: '.png' }),
            repeat: -1,
            frameRate: 10
        })
    
        // 蜥蜴跑动
        this.anims.create({
            key: 'lizard-run',
            frames: this.anims.generateFrameNames('lizard', { start: 0, end: 3, prefix: 'lizard_m_run_anim_f', suffix: '.png' }),
            repeat: -1,
            frameRate: 10
        }) 
        // 1. 先创建地图
        this.initMap(props.name);


        this.initNetEvent()

        this.initChests() 
        this.initEnemies()
        this.initCamera()
       
    }
 
 
    update() {
      this.bg.setPosition();
      this.player.update(this.room);
    }
    initMap(name) {
        this.bg = this.add.tileSprite(
          0,
          0,
          window.innerWidth,
          window.innerHeight,
          "background"
        );
    
        // 创建1个空地图
        this.map = this.make.tilemap({
          key: name,
          tileWidth: 16,
          tileHeight: 16,
        });
        this.tileset = this.map.addTilesetImage("Grass", "Grass") //往空地图添加 草地 图片
        this.groundLayer = this.map.createStaticLayer("Ground", this.tileset, 0, 0); // 地面图层
        this.wallsLayer = this.map.createStaticLayer("Walls", this.tileset, 0, 0);  // 墙 图层
        this.wallsLayer.setCollisionByProperty({ collides: true }); // 碰撞检查 前提是在Tiled软件中设置某图块，自定义属性为collides  
    
        // 设置物理引擎检查碰撞范围
        this.physics.world.setBounds(
          0,
          0,
          this.wallsLayer.width,
          this.wallsLayer.height
        );
       }
      initNetEvent(){
        var self = this
        let room = new SocketServer()
        this.room = room


        room.conn((data) => {
            if (data.event === 'PLAYER_JOINED') {
                console.log('PLAYER_JOINED'); 
                if (!onlinePlayers[data.sessionId]) {
                onlinePlayers[data.sessionId]  = self.player //new Player(self, self.wallsLayer, 100, 100, data.sessionId)
                //let player = onlinePlayers[data.sessionId]
                }
            }

            if (data.event === 'PLAYER_LEFT') {
                console.log('PLAYER_LEFT'); 
                if (onlinePlayers[data.sessionId]) {
                    onlinePlayers[data.sessionId].destroy();
                    delete onlinePlayers[data.sessionId];
                }
            }

            if (data.event === 'PLAYER_MOVED') {
                if (!onlinePlayers[data.sessionId]) {
                onlinePlayers[data.sessionId] = new Player(self, self.wallsLayer, data.x, data.y, data.sessionId)
                }
                onlinePlayers[data.sessionId].isWalking(data.x, data.y);
            } 
 
        })

        this.player = new Player(this, this.wallsLayer, 100, 100, this.room.sessionId || "张三" ); // 创建玩家(自己)
        if (!onlinePlayers[this.room.sessionId]) {
            onlinePlayers[this.room.sessionId]  = this.player
        }

      }


      initChests() {
        // 地图里面找所有宝箱的点
        const chestPoints = this.map.filterObjects("Chests", (obj) => obj.name === "ChestPoint");

        
        this.chests = chestPoints.map((chestPoint) => this.physics.add.sprite(
              chestPoint.x ,
              chestPoint.y ,
              "food",
              Math.floor(Math.random() * 8)
            ).setScale(0.5)
        )
    
        this.chests.forEach((chest) => {
          // @ts-ignore
          this.physics.add.overlap(this.player, chest, (obj1, obj2) => {
            this.game.events.emit(EVENTS_NAME.chestLoot) // 加 通关条件
           
            //this.game.events.emit(EVENTS_NAME.addPh) // 加血
            obj1.addHP()
            //console.log("玩家  ",obj1.id, " 捡 到宝贝 ", obj2)
            obj2.destroy();
          })
        }) 
    }

    initEnemies() {
         let self = this
         
        const enemiesPoints = this.map.filterObjects("Enemies",  (obj) => obj.name === "EnemyPoint");
          this.enemies = enemiesPoints.map((enemyPoint, id) =>
              new Enemy( this, enemyPoint.x , enemyPoint.y , self.player , id)
            //.setScale(1.5)
          );
      
          this.physics.add.collider(this.enemies, this.wallsLayer);
          this.physics.add.collider(this.enemies, this.enemies);
          this.physics.add.collider(self.player, 
            this.enemies, 
            function(obj1, obj2){
                obj1.getDamage(1)
                obj2.getDamage(1) 
                //console.log("玩家  ",obj1.id, " 与小怪/敌人 互砍", obj2.id)
            },
            undefined,
            this);
    }
    initCamera(){
      let self = this
        this.cameras.main.setSize(this.game.scale.width, this.game.scale.height);
        this.cameras.main.startFollow(self.player, true, 0.09, 0.09);
        this.cameras.main.setZoom(2); 
    }

    showDebugWalls() {
        const debugGraphics = this.add.graphics().setAlpha(0.7);
        this.wallsLayer.renderDebug(debugGraphics, {
          tileColor: null,
          collidingTileColor: new Phaser.Display.Color(243, 234, 48, 255),
        });
    }
    

}
