import  Player  from "./Player"; 
import Enemy  from "./Enemy";
import {UI}  from "./UI";
import { EVENTS_NAME } from "../../consts";
//import GrassPNG from "../../assets/tilemaps/json/Grass.png";

 
export class BasicsScene extends Phaser.Scene {
     player = null
     bg = null
     map = null
     tileset = null
     wallsLayer  = null
     groundLayer  = null
     chests  = null
     enemies  = null

    UI = null 
    constructor() {
        super("BasicsScene");
    }

    preload() {
      //this.load.image("Grass", GrassPNG)// 图块图片。 

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

        this.player = new Player(this, this.wallsLayer, 100, 100, "张三"); // 创建玩家(自己)
        this.initChests() 
        this.initEnemies()
        this.initCamera()
 
        this.physics.add.collider(this.player, this.wallsLayer); 


        this.UI = new UI()
        this.UI.create(this, props)
    }
 
    update() {
      this.bg.setPosition();
      this.player.update();
    }

    initMap(name) {
        this.bg = this.add.tileSprite( 0,  0,  window.innerWidth, window.innerHeight, "water");
        this.map = this.make.tilemap({ key: name, tileWidth: 16, tileHeight: 16,});
        this.tileset = this.map.addTilesetImage("Grass", "Grass") // 草地图片
        this.groundLayer = this.map.createLayer("Ground", this.tileset, 0, 0) // 地面
        this.wallsLayer = this.map.createLayer("Walls", this.tileset, 0, 0) // 墙
        this.wallsLayer.setCollisionByProperty({ collides: true })
    
        this.physics.world.setBounds(0, 0, this.wallsLayer.width, this.wallsLayer.height);
        //this.showDebugWalls();
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
            //this.game.events.emit(EVENTS_NAME.chestLoot) // 加 通关条件
           
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
                console.log("玩家  ",obj1.id, " 与小怪/敌人 互砍", obj2.id)
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