import  Player  from "./Player"; 
import Enemy  from "./Enemy";
import Monster  from "./Monster";
import {onlinePlayers} from '../../lib/net/SocketServer';
import {EasyStar}  from "../../lib/easystar.js";
import {BasicsScene} from "../basics/BasicsScene"; 

 
// 一个基础场景类，可以扩展为您自己使用。默认方法三个 init() preload() create()。
export class JuniorScene extends Phaser.Scene {
    player = null
    map = null
    tileset = null
    wallsLayer  = null
    groundLayer  = null
    chests  = null
    monster  = null 
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
    
    props = null
    create(props) { 
        this.scene.add('BasicsScene', BasicsScene, false, props);

        this.props = props
        this.SocketServer = props.SocketServer
        // 先创建地图 props.name = Level-1 / Level-2
        this.initMap(props.name)
        this.initChests() // 初始化宝贝
        this.initPlayer(props.name) // 初始化玩家 和 敌人
        //this.initMonster() // 初始化 怪物 它必须在初始化玩家之后执行
        this.initBasics()  // 初始化进入其他地图的大门


        // 设置物理引擎检查碰撞范围 设置为横坐标瓦片总个数 
        this.physics.world.setBounds(0, 0, this.wallsLayer.width , this.wallsLayer.height );

        // 设置相机
        this.cameras.main.setBackgroundColor('#000000')
        // 边界设置  是所有瓦片总和的宽高 否则镜头不跟随
        this.cameras.main.setBounds(0, 0,  this.wallsLayer.width , this.wallsLayer.height );
        //this.cameras.main.setSize(this.wallsLayer.width * 16, this.wallsLayer.height * 16);
        this.cameras.main.startFollow(this.player, true); //开启相机跟随 玩家

        //this.cameras.main.setViewport(0,0, 600, 800) //位置 和 相机镜头视野大小
        //this.cameras.main.setZoom(2); // 2倍 相机缩放值
        //this.cameras.main.setOrigin(0, 0); //设置中心点为原点
     


        // 虚拟摇杆
        this.virtualButton() 
        // 自动寻路
        this.findpath()
    }
    
    virtualButton(){
         // 虚拟攻击按键 
        // 创建一个圆形 
        this.virtualAttackButton = this.add.graphics();
        this.virtualAttackButton.fillStyle(0xcccccc, 1);
        let widtha = this.game.scale.width - 150
        let heighta = this.game.scale.height - 150
        this.virtualAttackButton.fillCircle(widtha, heighta, 60); 
        this.virtualAttackButton.setInteractive(new Phaser.Geom.Circle(widtha, heighta, 60), Phaser.Geom.Circle.Contains);
        
        //this.virtualAttackButton.setInteractive({useHandCursor:true})
        this.virtualAttackButton.setBlendMode(Phaser.BlendModes.SCREEN);
        this.virtualAttackButton.on("pointerup", (e)=>{
              //console.log(" 按下了攻击键", e ) // pointerup
              this.player.attackHandle(true) 
              e.event.stopPropagation();  
        }, this)
        this.virtualAttackButton.setScrollFactor(0)  // 将其固定在屏幕
        this.cameras.main.scrollFactorX = 1;
        this.cameras.main.scrollFactorY = 1;

        this.virtualAttackButton.setDepth(1); //设置图片的层级，数值越大，则层级越高，会在其他元素之上渲染

    }
 
    
    // ltime 当前时间。一个高分辨率定时器值，如果它来自请求动画帧，或日期。现在如果使用SetTimeout。
    // delta 从上一帧开始的时间单位是毫秒。这是一个基于FPS速率的平滑和上限值
    update(ltime, delta) {
        //this.findpathUpdate()
        this.player.update() 
        /**
        onlinePlayers.forEach((e, index) =>{
          e.update()
        }) 
        */ 
    }
 

    initMap(levelName) { 
        // 创建1个空地图
        this.map = this.make.tilemap({
            key: levelName, tileWidth: 16, 
            tileHeight: 16,width:100,height:100,
            insertNull:true //如果你有一个大的稀疏分布的地图，并且贴图数据不需要改变，那么将这个值设置为true将有助于减少内存消耗。然而，如果你的地图很小，或者你需要动态更新贴图，那么就保留默认值。
        });
        this.tileset = this.map.addTilesetImage("Grass", "Grass") //往空地图添加 草地 图片
        this.groundLayer = this.map.createLayer("Ground", this.tileset, 0, 0); // 地面图层
        this.wallsLayer = this.map.createLayer("Walls", this.tileset, 0, 0);  // 墙 图层
        
        // 参数1   应该检查的具有tile属性和相应值的对象。
        // 参数2 如果为真，它将启用碰撞。如果为false，则清除碰撞。
        // 参数3 更新后是否重新计算贴图面。
        // 参数4 瓷砖层使用。如果没有给定，则使用当前层。
        this.wallsLayer.setCollisionByProperty({ collides: true }, true, true, "Walls" ); // 碰撞检查 前提是在Tiled软件中设置某图块，自定义属性为collides  
    }
    
    initPlayer(levelName) {
        var self = this
        let net = this.SocketServer
        net.conn((data) => {
            if (data.event === 'PLAYER_JOINED') {
                // console.log('PLAYER_JOINED'); 
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
                // console.log('PLAYER_CLOSE'); 
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
                    //self.bindPlayerByMonster(otherPlayer) 
                } else {
                    otherPlayer = onlinePlayers[data.memberId]
                }
                //otherPlayer.addWalkingAnims({ x: data.x, y: data.y})
                otherPlayer.netEventHandle(data) // 去处理网络数据
            }

            if (data.event === 'PLAYER_BROADCAST') {
                // console.log('PLAYER_BROADCAST'); 
                if (onlinePlayers[data.memberId] && data.typ === "attack_hp") {
                    onlinePlayers[data.memberId].getDamage(data.hp)
                }
                if (onlinePlayers[data.memberId] && data.typ === "attack_action") {
                    onlinePlayers[data.memberId].attackHandle(false)
                }

                if (onlinePlayers[data.memberId] && data.typ === "chests_hp") {
                    onlinePlayers[data.memberId].addHP(false)
                }

                if (onlinePlayers[data.memberId] && data.typ === "walking_stop") {
                    onlinePlayers[data.memberId].walkingStop(false)
                } 
            }
        })

        this.player = new Player(this, this.wallsLayer, 100, 100, this.SocketServer); // 创建玩家(自己)
        if (onlinePlayers[this.SocketServer.memberId]) {
            onlinePlayers[this.SocketServer.memberId].destroy()
            delete onlinePlayers[this.SocketServer.memberId];
        }
        onlinePlayers[this.SocketServer.memberId]  = this.player
       
        this.bindPlayerByChests(this.player) 
        this.initEnemies(this.player)
    }


    initChests() {
        let self = this 
        // 地图里面找所有宝箱的点
        const chestPoints = this.map.filterObjects("Chests", (obj) => obj.name === "ChestPoint")
        this.chests = chestPoints.map((chestPoint) => self.physics.add.sprite(chestPoint.x ,chestPoint.y ,"food",Math.floor(Math.random() * 8)).setScale(0.5))
    }

    initBasics(){
        let self = this 
        const basicsPoints = this.map.filterObjects("Basics",  (obj) => obj.name === "BasicsPoint");
        let items = basicsPoints.map((item, id) => self.physics.add.sprite(item.x ,item.y ,"food", Math.floor(Math.random() * 8)).setScale(2))
        items.forEach((item) => {
            // 检查玩家是否重叠
            self.physics.add.overlap(self.player, item, (obj1, obj2) => { 
                console.log("检查玩家是否重叠", obj1, obj2)
                self.toBasicsScene() // 调整场景
            })
        })
    }

    toBasicsScene(){

        this.scene.start('BasicsScene', this.props); 
        this.game.scene.pause("JuniorScene") // 暂停游戏场景 

        this.scene.remove('JuniorScene'); 

        // this.scene.launch('BasicsScene', this.props);
    }

    bindPlayerByChests(player) { // 绑定玩家与宝箱的物理碰撞关系
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



    initEnemies(player) {
        let self = this 
        const enemiesPoints = this.map.filterObjects("Enemies",  (obj) => obj.name === "EnemyPoint");
        let items = enemiesPoints.map((enemyPoint, id) => new Monster(this,this.wallsLayer, enemyPoint.x, enemyPoint.y, self.player, id) )
        /**
        this.physics.add.collider(items, this.wallsLayer);
       
        this.physics.add.collider(items, items);
         
         *  this.physics.add.collider(self.player, items, function(obj1, obj2){
            obj1.getDamage(1)
            obj2.getDamage(1) 
            console.log("玩家  ",obj1.id, " 与小怪/敌人 互砍", obj2.id)
        },
        undefined,
        this);
        */
        items.forEach((item) => {
            // 检查玩家是否与任何宝箱重叠
            this.physics.add.overlap(player, item, (obj1, obj2) => {
                // this.game.events.emit(EVENTS_NAME.chestLoot, {memberId: obj1.id}) // 加 通关条件 
                obj1.getDamage(1)
                obj2.getDamage(1) 
                // console.log("玩家  ",obj1.id, " 与小怪/敌人 互砍", obj2.id)
            })
        })

    }
   
    initMonster() {
        let self = this 
        // 地图里面找所有宝箱的点
        const monsterPoints = this.map.filterObjects("Enemies", (obj) => obj.name === "EnemyPoint");
        this.monster = monsterPoints.map((item, id) =>  new Monster(self, item.x, item.y, id));
    }

    bindPlayerByMonster(player) {// 绑定玩家与怪物的物理碰撞关系
        if (this.monster.length <= 0) {
            this.initMonster() 
        }
        this.physics.add.collider(this.monster, this.wallsLayer);
        //this.physics.add.collider(this.monster, this.monster);
       /**
        this.physics.add.collider(this.player, this.monster, (obj1, obj2) => {
                obj1.getDamage(1)
                obj2.getDamage(1)
                console.log("玩家  ",obj1.id, " 与小怪/敌人 互砍", obj2.id)
            }, undefined, this);
        */
        this.monster.forEach((item) => {
            // 只要有玩家与怪物重叠 
            this.physics.add.overlap(player, item, (obj1, obj2) => {
                obj1.setTarget(player) // 将玩家设置为怪物攻击目录
                obj1.getDamage(1) // 加血
                obj2.getDamage(1)
                // console.log("玩家  ",obj1.id, " 与小怪/敌人 互砍", obj2.id)
            })
        })
         
    }


    ///////////////////////////自动寻路///////////////////////// 
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

    // 记录上次点击时间
    lastClickTime = 0

    // 自动寻路
    findpath() {
        //this.input.setInteractive({ useHandCursor: true }); 
        this.input.on('pointerup', (pointer, e) => {
            if (e.length > 0) {
                return
            }
             
            // 记录点击时间
            let currentTime = this.time.now;

            // 判断是否为双击事件
            if (currentTime - this.lastClickTime < 300) {
                // 处理双击事件
                //console.log('double click!');
                this.handleClick(pointer, e) 
            }
            this.lastClickTime = currentTime; 
        }, this).stopPropagation();
 
        // 在点击的位置画个框 
        this.marker = this.add.graphics();
        this.marker.lineStyle(3, 0xffffff, 1);
        this.marker.strokeRect(0, 0, this.map.tileWidth, this.map.tileHeight);

        this.finder = new EasyStar.js();

        var grid = [];
        for(var y = 0; y < this.map.height; y++){
            var col = [];
            for(var x = 0; x < this.map.width; x++){
                // 在每个单元格中，我们存储tile的ID，它对应于它在map的tile集中的索引(Tiled中的"ID"字段)
                let id = this.getTileID(x,y)
                col.push(id);
            }
            grid.push(col);
        }
        //console.log("grid.length : [ [100 ...] [100 ...] ... 100]    ")
        this.finder.setGrid(grid)

        
        var tileset = this.map.tilesets[0];
        var properties = tileset.tileProperties; // 全是标记为 碰撞标识的对象
        var allowTiles = [];
        //console.log("----properties ", properties)
        //我们需要列出所有可以在上面行走的tile id。让我们遍历它们 并查看在Tiled中输入了哪些属性。
        for(var i = tileset.firstgid-1; i < this.tileset.total; i++) {
            //   判断 碰撞标识的对象中 是否包含 i
            if(properties.hasOwnProperty(i)) {
                // 如果没有显示任何属性，这意味着它是一个可行走的瓷砖
                //console.log("----properties.collides--> index: ", i ,  properties[i])
            } else {
                allowTiles.push(i+1);
            }
        }
        
        this.finder.setAcceptableTiles(allowTiles);
    }

      
    checkCollision(x,y){
        var pointerTileX = this.map.worldToTileX(x)
        var pointerTileY = this.map.worldToTileY(y)
        let tile = this.wallsLayer.getTileAt(pointerTileX, pointerTileY)  

        //let tile = this.map.getTileAt(pointerTileX, pointerTileY);
        if (tile) {
            return tile.properties.collides == true;
        } 
        return false 
    }
  
    findpathUpdate() {
        var worldPoint = this.input.activePointer.positionToCamera(this.cameras.main) 
        // 世界地图中的xy坐标 映射到  瓦片 xy
        var pointerTileX = this.map.worldToTileX(worldPoint.x); //x
        var pointerTileY = this.map.worldToTileY(worldPoint.y);
        this.marker.x = this.map.tileToWorldX(pointerTileX);
        this.marker.y = this.map.tileToWorldY(pointerTileY);
        this.marker.setVisible(!this.checkCollision(pointerTileX, pointerTileY))
    }

    handleClick(pointer, e){
      let self = this
      //TODO  清空其他待播放的走路动画
      self.player.walkingIndexAdd()
      
      // 2秒后将其隐藏 
      self.findpathUpdate(pointer.x, pointer.y)
      self.time.delayedCall(1000, (e) => {
         this.marker.setVisible(false)
      })

      var x = this.cameras.main.scrollX + pointer.x;
      var y = this.cameras.main.scrollY + pointer.y;
      var toX = Math.floor(x/16);
      var toY = Math.floor(y/16);
      var fromX = Math.floor(this.player.x/16);
      var fromY = Math.floor(this.player.y/16);
      //console.log('going from ('+fromX+','+fromY+') to ('+toX+','+toY+')');

      this.finder.findPath(fromX, fromY, toX, toY, function( path ) {
          if (path === null) {
            console.warn("Path was not found.");
            return
          }
          self.moveCharacter(path);
      })
      this.finder.calculate(); // don't forget, otherwise nothing happens

      pointer.event.stopPropagation();
    }

    moveCharacter (path){
      let self = this
      // 设置一个补间列表，每个瓷砖走一个，将由时间轴链接
      var tweens = [];
      for(var i = 0; i < path.length-1; i++){
          var ex = path[i+1].x;
          var ey = path[i+1].y;

          let x = this.map.tileToWorldX(ex,self.cameras.main)
          let y = this.map.tileToWorldY(ey,self.cameras.main)

          tweens.push({
              targets: self.player,
              x: {value: x, duration: 200},
              y: {value: y, duration: 200}
        });
      }
 
      // 暂停动画
      tweens.push({targets: self.player, x:{value: 0}, y:{value: 0}})
      let idx = self.player.walkingIndex
      tweens.forEach((e, index) =>{
        // 计算朝向 
        let x = e.x.value
        let y = e.y.value 
        self.time.delayedCall(100 * index, () => {
            e.targets.addWalkingAnims({ x: x, y: y, walkingIndex: idx})
            
         })
      })

      //console.log("this.player.walkingStop() 暂停动画 ")
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

 
}