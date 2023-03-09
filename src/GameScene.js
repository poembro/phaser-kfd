import  Player  from "./Player"; 
import Enemy  from "./Enemy"; 
import { EVENTS_NAME } from "./consts";
import {onlinePlayers, SocketServer} from './net/SocketServer';

 
// 一个基础场景类，可以扩展为您自己使用。默认方法三个 init() preload() create()。
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
        // UI那边 调用scene.restart(game-scene) 本类所有东西会重新执行
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
        this.initChests()
        this.initPlayer(props.name)
        
        this.initCamera() 
    }
  
    // ltime 当前时间。一个高分辨率定时器值，如果它来自请求动画帧，或日期。现在如果使用SetTimeout。
    // delta 从上一帧开始的时间单位是毫秒。这是一个基于FPS速率的平滑和上限值
    update(ltime,delta) {
      this.bg.setPosition()
      this.player.update(this.SocketServer)
    }
 

    initMap(levelName) {
        this.bg = this.add.tileSprite(0,0, window.innerWidth, window.innerHeight, "background")
    
        // 创建1个空地图
        this.map = this.make.tilemap({key: levelName, tileWidth: 16, tileHeight: 16,});
        this.tileset = this.map.addTilesetImage("Grass", "Grass") //往空地图添加 草地 图片
        this.groundLayer = this.map.createStaticLayer("Ground", this.tileset, 0, 0); // 地面图层
        this.wallsLayer = this.map.createStaticLayer("Walls", this.tileset, 0, 0);  // 墙 图层
        this.wallsLayer.setCollisionByProperty({ collides: true }); // 碰撞检查 前提是在Tiled软件中设置某图块，自定义属性为collides  
    
        // 设置物理引擎检查碰撞范围
        this.physics.world.setBounds(0, 0, this.wallsLayer.width, this.wallsLayer.height);
    }
    
    initPlayer(levelName){
        var self = this
        let net = new SocketServer()
        this.SocketServer = net
 
        net.conn((data) => {
            if (data.event === 'PLAYER_JOINED') {
                console.log('PLAYER_JOINED'); 
                if (!onlinePlayers[data.memberId]) {
                    let otherPlayer = new Player(self, self.wallsLayer, 100, 100, data.memberId)
                    onlinePlayers[data.memberId] = otherPlayer
                    // 检查下新玩家与自己重叠
                    self.physics.add.overlap(self.player, otherPlayer, (obj1, obj2) => { 
                        console.log("玩家  ",obj1.id, " 检查下新玩家与自己重叠 ", obj2.id)
                    })
                }
            }

            if (data.event === 'PLAYER_CLOSE') {
                console.log('PLAYER_CLOSE'); 
                if (onlinePlayers[data.memberId]) {
                    onlinePlayers[data.memberId].destroy();
                    delete onlinePlayers[data.memberId];
                }
            }

            if (data.event === 'PLAYER_MOVED') {
                let otherPlayer = null
                if (!onlinePlayers[data.memberId]) {
                    otherPlayer =  new Enemy(self, self.wallsLayer, 150, 150, self.player, data.memberId)
                    onlinePlayers[data.memberId] = otherPlayer
                    
                    self.bindPlayerByChests(otherPlayer)  
                } else {
                    otherPlayer = onlinePlayers[data.memberId]
                }
                
                otherPlayer.netEventHandle(data) // 去处理网络数据
            }

            if (data.event === 'PLAYER_BROADCAST') {
                console.log('PLAYER_BROADCAST'); 
                if (onlinePlayers[data.memberId] && data.typ === "attack_hp") {
                    onlinePlayers[data.memberId].getDamage(data.hp)
                }
                if (onlinePlayers[data.memberId] && data.typ === "attack_action") {
                    onlinePlayers[data.memberId].attackHandle(data.hp)
                }

                if (onlinePlayers[data.memberId] && data.typ === "chests_hp") {
                    onlinePlayers[data.memberId].addHP(null)
                }
            }
        })

        this.player = new Player(this, this.wallsLayer, 100, 100, this.SocketServer.memberId || "我" ); // 创建玩家(自己)
        if (!onlinePlayers[this.SocketServer.memberId]) {
            onlinePlayers[this.SocketServer.memberId]  = this.player
        } 

        this.bindPlayerByChests(this.player, net) 
    }


    initChests() {
        let self = this 
        // 地图里面找所有宝箱的点
        const chestPoints = this.map.filterObjects("Chests", (obj) => obj.name === "ChestPoint")
        this.chests = chestPoints.map((chestPoint) => self.physics.add.sprite(chestPoint.x ,chestPoint.y ,"food",Math.floor(Math.random() * 8)).setScale(0.5))
    }

    bindPlayerByChests(player, net) { // 绑定玩家与宝箱的物理碰撞关系
        this.chests.forEach((item) => {
            // 检查玩家是否与任何宝箱重叠
            this.physics.add.overlap(player, item, (obj1, obj2) => {
                // this.game.events.emit(EVENTS_NAME.chestLoot, {memberId: obj1.id}) // 加 通关条件 
                obj1.addHP(net) // 加血
                obj2.destroy()
                //console.log("玩家  ",obj1.id, " 捡 到宝贝 ", obj2)
            })
        })
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
