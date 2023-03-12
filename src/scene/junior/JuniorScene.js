import  Player  from "./Player"; 
import Enemy  from "./Enemy"; 
//import { EVENTS_NAME } from "../../consts";
import {onlinePlayers, SocketServer} from '../../lib/net/SocketServer';
import {EasyStar}  from "../../lib/easystar.js";

 
// 一个基础场景类，可以扩展为您自己使用。默认方法三个 init() preload() create()。
export class JuniorScene extends Phaser.Scene {
    player = null
     map = null
    tileset = null
    wallsLayer  = null
    groundLayer  = null
    chests  = null
    enemies  = null 
    SocketServer = null // 网络服务对象
 
    constructor() {
        super("JuniorScene")
    }

    preload() {
        // UI那边 调用scene.restart(game-scene) 本类所有东西会重新执行
        // 蜥蜴空闲
        this.anims.create({key: 'lizard-idle',
            frames: this.anims.generateFrameNames('lizard', {start: 0, end: 3, prefix: 'lizard_m_idle_anim_f', suffix: '.png' }),
            repeat: -1, frameRate: 10
        })
    
        // 蜥蜴跑动
        this.anims.create({key: 'lizard-run',
            frames: this.anims.generateFrameNames('lizard', {start: 0, end: 3, prefix: 'lizard_m_run_anim_f', suffix: '.png' }),
            repeat: -1, frameRate: 10
        })
    }
    
    create(props) { 
        this.SocketServer = props.SocketServer
        // 先创建地图 props.name = Level-1 / Level-2
        this.initMap(props.name)
        this.initChests()
        this.initPlayer(props.name)
        
        // 设置相机
        this.cameras.main.setBounds(0, 0, this.wallsLayer.width, this.wallsLayer.height); // 边界设置
        this.cameras.main.setSize(this.game.scale.width, this.game.scale.height);
        this.cameras.main.startFollow(this.player); //开启相机跟随 玩家
        //this.cameras.main.setZoom(2); 
        //this.cameras.main.setOrigin(0, 0); //设置中心点为原点

        this.findpath()
    }
  
    // ltime 当前时间。一个高分辨率定时器值，如果它来自请求动画帧，或日期。现在如果使用SetTimeout。
    // delta 从上一帧开始的时间单位是毫秒。这是一个基于FPS速率的平滑和上限值
    update(ltime, delta) {
       this.findpathUpdate()
       this.player.update()
    }
 

    initMap(levelName) { 
        // 创建1个空地图
        this.map = this.make.tilemap({key: levelName, tileWidth: 16, 
            tileHeight: 16,width:100,height:100,
            insertNull:false //如果你有一个大的稀疏分布的地图，并且贴图数据不需要改变，那么将这个值设置为true将有助于减少内存消耗。然而，如果你的地图很小，或者你需要动态更新贴图，那么就保留默认值。
        });
        this.tileset = this.map.addTilesetImage("Grass", "Grass") //往空地图添加 草地 图片
        this.groundLayer = this.map.createLayer("Ground", this.tileset, 0, 0); // 地面图层
        this.wallsLayer = this.map.createLayer("Walls", this.tileset, 0, 0);  // 墙 图层
        
        // 参数1   应该检查的具有tile属性和相应值的对象。
        // 参数2 如果为真，它将启用碰撞。如果为false，则清除碰撞。
        // 参数3 更新后是否重新计算贴图面。
        // 参数4 瓷砖层使用。如果没有给定，则使用当前层。
        this.wallsLayer.setCollisionByProperty({ collides: true }, true, true,"Walls" ); // 碰撞检查 前提是在Tiled软件中设置某图块，自定义属性为collides  
    
        // 设置物理引擎检查碰撞范围
        this.physics.world.setBounds(0, 0, 16*100, 16*100);
    }
    
    initPlayer(levelName){
        var self = this
  
        let net = this.SocketServer
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
                    onlinePlayers[data.memberId].attackHandle()
                }

                if (onlinePlayers[data.memberId] && data.typ === "chests_hp") {
                    onlinePlayers[data.memberId].addHP(false)
                }
            }
        })

        this.player = new Player(this, this.wallsLayer, 100, 100, this.SocketServer); // 创建玩家(自己)
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
                obj1.addHP(true) // 加血
                obj2.destroy()
                //console.log("玩家  ",obj1.id, " 捡 到宝贝 ", obj2)
            })
        })
    }
   
    showDebugWalls() {
        const debugGraphics = this.add.graphics().setAlpha(0.7);
        this.wallsLayer.renderDebug(debugGraphics, {
          tileColor: null,
          collidingTileColor: new Phaser.Display.Color(243, 234, 48, 255),
        });
    }

    ////////////////////////////////////////////////////

     // 自动寻路
     findpath() {
        this.input.on('pointerup',this.handleClick, this);
        this.marker = this.add.graphics();  // 点击的时候有个鼠标框框
        this.marker.lineStyle(3, 0xffffff, 1);
        this.marker.strokeRect(0, 0, this.map.tileWidth, this.map.tileHeight);
        this.finder = new EasyStar.js();

        var grid = [];
        for(var y = 0; y < this.map.height; y++){
            var col = [];
            for(var x = 0; x < this.map.width; x++){
                // 在每个单元格中，我们存储tile的ID，它对应于它在map的tile集中的索引(Tiled中的"ID"字段)
                let id = this.getTileID(x,y)
                //console.log("this.getTileID(x,y) ---> ",  id )
                col.push(id);
            }
            grid.push(col);
        }
        //console.log("grid.length : [ [100 ...] [100 ...] ... 100]    ")
        this.finder.setGrid(grid)

        
        var tileset = this.map.tilesets[0];
        var properties = tileset.tileProperties; // 全是标记为 碰撞标识的对象
        var acceptableTiles = [];
        //console.log("----properties ", properties)
        //我们需要列出所有可以在上面行走的tile id。让我们遍历它们 并查看在Tiled中输入了哪些属性。
        for(var i = tileset.firstgid-1; i < this.tileset.total; i++){ 
            //   判断 碰撞标识的对象中 是否包含 i
            if(properties.hasOwnProperty(i)) {
                // 如果没有显示任何属性，这意味着它是一个可行走的瓷砖
                //console.log("----properties.collides--> index: ", i ,  properties[i])
            } else {
                acceptableTiles.push(i+1);
            }
 
            //if(!properties[i].collides) acceptableTiles.push(i+1);
            // 如果有一个成本附加到瓷砖，让我们登记它
            //if(properties[i].cost) this.finder.setTileCost(i+1, properties[i].cost); 
        }
        //console.log(acceptableTiles)
        this.finder.setAcceptableTiles(acceptableTiles);
    }

    handleClick(pointer){
      //console.log("--------> ",  pointer.x,"--------> ",  pointer.y)
      let self = this
      var x = this.cameras.main.scrollX + pointer.x;
      var y = this.cameras.main.scrollY + pointer.y;
      //console.log("--------> ",  pointer.x,"--------> ",  pointer.y,"--------> ",  x,"--------> ",  y )
      var toX = Math.floor(x/16);
      var toY = Math.floor(y/16);
    // console.log(this.player)
      var fromX = Math.floor(this.player.x/16);
      var fromY = Math.floor(this.player.y/16);
      //console.log('going from ('+fromX+','+fromY+') to ('+toX+','+toY+')');

      this.finder.findPath(fromX, fromY, toX, toY, function( path ) {
          if (path === null) {
              console.warn("Path was not found.");
          } else {
              //console.log(path);
              self.moveCharacter(path);
          }
      });
      this.finder.calculate(); // don't forget, otherwise nothing happens
    }

    moveCharacter (path){
      let self = this
      // 设置一个补间列表，每个瓷砖走一个，将由时间轴链接
      var tweens = [];
      for(var i = 0; i < path.length-1; i++){
          var ex = path[i+1].x;
          var ey = path[i+1].y;
          tweens.push({
              targets: this.player,
              x: {value: ex*this.map.tileWidth, duration: 200},
              y: {value: ey*this.map.tileHeight, duration: 200}
          });
      }

      
      tweens.forEach((e, index) =>{
        // 计算朝向
        let action = 0
        let x =  e.x.value
        let y =  e.y.value

        // 判断朝向
        if ( x > e.targets.x )  action = 6
        if (! x > e.targets.x )  action = 4
        if ( y > e.targets.y )  action = 2
        if (! y > e.targets.y )  action = 8

       
        self.time.delayedCall(80 * index, () => {
            console.log("x, y, action", x, y, action)
            e.targets.walkingHandle(x, y, action)   //采用物理引擎帧动画
            e.targets.walkingHandle(x, y, action)   //采用物理引擎帧动画
            e.targets.walkingHandle(x, y, action)   //采用物理引擎帧动画
            e.targets.walkingHandle(x, y, action)   //采用物理引擎帧动画

            self.SocketServer.send({
                event: "PLAYER_MOVED",
                action: action,
                x: x,
                y: y
            })
        }); 
       
      })
      /**  间补动画移动人物     
      this.scene.scene.tweens.timeline({
          tweens: tweens,
          onStart: (timeline, param) => { 
            //a.forEach((e) =>{ self.SocketServer.send(e) })
          },
          onUpdate: (timeline, param) => { 
            //b.forEach((e) =>{ self.SocketServer.send(e) })
          },
          onComplete: (timeline, param) => { 
            //c.forEach((e) =>{ self.SocketServer.send(e) })
          }
      }); 
     */
    }
    findpathUpdate() {
      var worldPoint = this.input.activePointer.positionToCamera(this.cameras.main) 
      // 世界地图中的xy坐标 映射到  瓦片 xy
      var pointerTileX = this.map.worldToTileX(worldPoint.x);
      var pointerTileY = this.map.worldToTileY(worldPoint.y);
      this.marker.x = this.map.tileToWorldX(pointerTileX);
      this.marker.y = this.map.tileToWorldY(pointerTileY);
      this.marker.setVisible(!this.checkCollision(pointerTileX,pointerTileY))
    }


    checkCollision(x,y){
      let tile = this.map.getTileAt(x, y);
      if (tile) { 
        return tile.properties.collide == true;
      } 
      return false 
    }

    getTileID(x,y){ 
      // Game.map.getTileAt(x, y); 该方法有缓存  及其恶心
      let tile = this.wallsLayer.getTileAt(x, y)  
      if (!tile) {
        tile = this.groundLayer.getTileAt(x, y)
      } 
      if (!tile) {
        tile = {index : 0}
      }
      //console.log("---------","x",x, "y",y, tile)
      return tile.index;
    }
 
}