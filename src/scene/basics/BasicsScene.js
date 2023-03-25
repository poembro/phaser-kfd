import  Player  from "./Player"; 
import Enemy  from "./Enemy";
import { EVENTS_NAME } from "../../consts";
import {EasyStar}  from "../../lib/easystar.js";

export class BasicsScene extends Phaser.Scene {
     player = null
    // bg = null
     map = null
     tileset = null
     wallsLayer  = null
     groundLayer  = null
     chests  = null
     enemies  = null
 
    constructor() {
        super("BasicsScene");
    }

    preload() {
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
    }

    create(props) {
        // 1. 先创建地图
        this.initMap(props.name);

        this.player = new Player(this, this.wallsLayer, 100, 100, "我"); // 创建玩家(自己)
        this.initChests() 
        this.initEnemies()
        //this.initCamera()
 
        this.physics.add.collider(this.player, this.wallsLayer); // 将玩家加入碰撞范围地图去 
        
        // 设置相机
        this.cameras.main.setBackgroundColor('#000000')
        // 边界设置  是所有瓦片总和的宽高 否则镜头不跟随
        this.cameras.main.setBounds(0, 0, this.wallsLayer.width , this.wallsLayer.height ); 
        this.cameras.main.startFollow(this.player); //开启相机跟随 玩家

        this.findpath()
         // 虚拟摇杆
        this.virtualButton() 
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

    update() {
      this.player.update();
    }

    initMap(levelName) { 
      // 创建1个地图
      this.map = this.make.tilemap({key: levelName, tileWidth: 16, 
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
      this.wallsLayer.setCollisionByProperty({ collides: true }, true, true, "Walls"); // 碰撞检查 前提是在Tiled软件中设置某图块，自定义属性为collides  
  
      // 设置物理引擎检查碰撞范围
      this.physics.world.setBounds(0, 0, this.wallsLayer.width , this.wallsLayer.height );
 
      this.showDebugWalls();
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
                //console.log("玩家  ",obj1.id, " 与小怪/敌人 互砍", obj2.id)
            },
            undefined,
            this);
    }
   

    showDebugWalls() {
        const debugGraphics = this.add.graphics().setAlpha(0.7);
        this.wallsLayer.renderDebug(debugGraphics, {
          tileColor: null,
          collidingTileColor: new Phaser.Display.Color(243, 234, 48, 255),
        });
    }


     // 自动寻路
    findpath() {
        this.input.on('pointerup', (pointer, e) => {
            if (e.length > 0) {
                return
            }
             
            this.handleClick(pointer, e) 
        }, this).stopPropagation();

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
        //我们需要列出所有可以在上面行走的tile id。让我们遍历它们 并查看在Tiled中输入了哪些属性。
        for(var i = tileset.firstgid-1; i < this.tileset.total; i++){ 
            //   判断 碰撞标识的对象中 是否包含 i
            if(properties.hasOwnProperty(i)) {
                // 如果没有显示任何属性，这意味着它是一个可行走的瓷砖
            } else {
                acceptableTiles.push(i+1);
            }
 
            //if(!properties[i].collides) acceptableTiles.push(i+1);
            // 如果有一个成本附加到瓷砖，让我们登记它
            //if(properties[i].cost) this.finder.setTileCost(i+1, properties[i].cost); 
        }
        this.finder.setAcceptableTiles(acceptableTiles);
    }

    handleClick(pointer){
      let self = this
       //TODO  清空其他待播放的走路动画
       self.player.walkingIndexAdd()

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