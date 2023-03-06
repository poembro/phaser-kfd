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
    SocketServer = null // 网络服务对象
    constructor() {
        super("game-scene");
    }

    preload() {
        
    }

    create(props) {
        // 蜥蜴空闲
        this.anims.create({key: 'lizard-idle',
            frames: this.anims.generateFrameNames('lizard', { start: 0, end: 3, prefix: 'lizard_m_idle_anim_f', suffix: '.png' }),
            repeat: -1,frameRate: 10
        })
    
        // 蜥蜴跑动
        this.anims.create({key: 'lizard-run',
            frames: this.anims.generateFrameNames('lizard', { start: 0, end: 3, prefix: 'lizard_m_run_anim_f', suffix: '.png' }),
            repeat: -1,frameRate: 10
        }) 

        // 先创建地图 props.name = Level-1 / Level-2
        this.initMap(props.name)
        this.initPlayer()
        this.initChests() 
        this.initEnemies()
        this.initCamera()
    }
  
    update() {
      this.bg.setPosition();
      this.player.update(this.SocketServer);
    }

    destroy() {
        this.bg.destroy()
        this.map.destroy()
        this.player.destroy()
    }

    initMap(name) {
        this.bg = this.add.tileSprite(0,0, window.innerWidth, window.innerHeight, "background")
    
        // 创建1个空地图
        this.map = this.make.tilemap({key: name, tileWidth: 16, tileHeight: 16,});
        this.tileset = this.map.addTilesetImage("Grass", "Grass") //往空地图添加 草地 图片
        this.groundLayer = this.map.createStaticLayer("Ground", this.tileset, 0, 0); // 地面图层
        this.wallsLayer = this.map.createStaticLayer("Walls", this.tileset, 0, 0);  // 墙 图层
        this.wallsLayer.setCollisionByProperty({ collides: true }); // 碰撞检查 前提是在Tiled软件中设置某图块，自定义属性为collides  
    
        // 设置物理引擎检查碰撞范围
        this.physics.world.setBounds(0, 0, this.wallsLayer.width, this.wallsLayer.height);
    }
    
    initPlayer(){
        var self = this
        let net = new SocketServer()
        this.SocketServer = net
 
        net.conn((data) => {
            if (data.event === 'PLAYER_JOINED') {
                console.log('PLAYER_JOINED'); 
                if (!onlinePlayers[data.sessionId]) {
                    onlinePlayers[data.sessionId] = new Player(self, self.wallsLayer, 100, 100, data.sessionId)
                }
            }

            if (data.event === 'PLAYER_CLOSE') {
                console.log('PLAYER_CLOSE'); 
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

        this.player = new Player(this, this.wallsLayer, 100, 100, this.SocketServer.sessionId || "我" ); // 创建玩家(自己)
        if (!onlinePlayers[this.SocketServer.sessionId]) {
            onlinePlayers[this.SocketServer.sessionId]  = this.player
        } 
    }


    initChests() {
        // 地图里面找所有宝箱的点
        const chestPoints = this.map.filterObjects("Chests", (obj) => obj.name === "ChestPoint")
        this.chests = chestPoints.map((chestPoint) => this.physics.add.sprite(chestPoint.x ,chestPoint.y ,"food",Math.floor(Math.random() * 8)).setScale(0.5))
    
        this.chests.forEach((item) => {
          // 检查玩家是否与任何宝箱重叠
          this.physics.add.overlap(this.player, item, (obj1, obj2) => {
            this.game.events.emit(EVENTS_NAME.chestLoot) // 加 通关条件 
            obj1.addHP() // 加血
            obj2.destroy();
            //console.log("玩家  ",obj1.id, " 捡 到宝贝 ", obj2)
          })
        })
    }

    initEnemies() {
        let self = this 
        const enemiesPoints = this.map.filterObjects("Enemies", (obj) => obj.name === "EnemyPoint");
        this.enemies = enemiesPoints.map((enemyPoint, id) => new Enemy(this, enemyPoint.x, enemyPoint.y, self.player, id))
      
        this.physics.add.collider(this.enemies, this.wallsLayer)
        this.physics.add.collider(this.enemies, this.enemies)
        this.physics.add.collider(self.player, this.enemies, (obj1, obj2) => {
            obj1.getDamage(1)
            obj2.getDamage(1) 
            //console.log("玩家  ",obj1.id, " 与小怪/敌人 互砍", obj2.id)
        },
        undefined,
        this)
    }

    initCamera(){
        let self = this
        // 缩放并重新调整相机中心
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
