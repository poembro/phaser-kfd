import {EasyStar}  from "../../lib/easystar.js";

export default class AutoFindPath{
    constructor(scene) {
        this.scene = scene 
    }

    marker = null 
    finder = null 
    ///////////////////////////自动寻路///////////////////////// 
    getTileID(x,y){ 
        let self = this.scene
        // Game.map.getTileAt(x, y); 该方法有缓存  及其恶心
        let tile = self.wallsLayer.getTileAt(x, y)  
        if (!tile) {
          tile = self.groundLayer.getTileAt(x, y)
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
        let self = this.scene
        //this.input.setInteractive({ useHandCursor: true }); 
        self.input.on('pointerup', (pointer, e) => {
            if (e.length > 0) {
                return
            }
             
            // 记录点击时间
            let currentTime = self.time.now;

            // 判断是否为双击事件
            if (currentTime - this.lastClickTime < 300) {
                // 处理双击事件
                //console.log('double click!');
                this.handleClick(pointer, e) 
            }
            this.lastClickTime = currentTime;
            
            
            self.player.sendMessage("坐标  x:" + pointer.x + " y" + pointer.y) 

        }, self).stopPropagation();
 
        // 在点击的位置画个框 
        this.marker = self.add.graphics();
        this.marker.lineStyle(3, 0xffffff, 1);
        this.marker.strokeRect(0, 0, self.map.tileWidth, self.map.tileHeight);

        this.finder = new EasyStar.js();

        var grid = [];
        for(var y = 0; y < self.map.height; y++){
            var col = [];
            for(var x = 0; x < self.map.width; x++){
                // 在每个单元格中，我们存储tile的ID，它对应于它在map的tile集中的索引(Tiled中的"ID"字段)
                let id = this.getTileID(x,y)
                col.push(id);
            }
            grid.push(col);
        }
        //console.log("grid.length : [ [100 ...] [100 ...] ... 100]    ")
        this.finder.setGrid(grid)

        
        var tileset = self.map.tilesets[0];
        var properties = tileset.tileProperties; // 全是标记为 碰撞标识的对象
        var allowTiles = [];
        //console.log("----properties ", properties)
        //我们需要列出所有可以在上面行走的tile id。让我们遍历它们 并查看在Tiled中输入了哪些属性。
        for(var i = tileset.firstgid-1; i < self.tileset.total; i++) {
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
        let self = this.scene
        let pointerTileX = self.map.worldToTileX(x)
        let pointerTileY = self.map.worldToTileY(y)
        let tile = self.wallsLayer.getTileAt(pointerTileX, pointerTileY)  

        //let tile = this.map.getTileAt(pointerTileX, pointerTileY);
        if (tile) {
            return tile.properties.collides == true;
        }
        return false 
    }
  
    findpathUpdate() {
        let self = this.scene
        let worldPoint = self.input.activePointer.positionToCamera(self.cameras.main) 
        // 世界地图中的xy坐标 映射到  瓦片 xy
        let pointerTileX = self.map.worldToTileX(worldPoint.x); //x
        let pointerTileY = self.map.worldToTileY(worldPoint.y);
        this.marker.x = self.map.tileToWorldX(pointerTileX);
        this.marker.y = self.map.tileToWorldY(pointerTileY);
        this.marker.setVisible(!this.checkCollision(pointerTileX, pointerTileY))
    }

    handleClick(pointer, e){
      let myself = this
      let self = this.scene
      //TODO  清空其他待播放的走路动画
      self.player.walkingIndexAdd()
      
      // 2秒后将其隐藏 
      myself.findpathUpdate(pointer.x, pointer.y)
      self.time.delayedCall(1000, (e) => {
        myself.marker.setVisible(false)
      })

      var x = self.cameras.main.scrollX + pointer.x;
      var y = self.cameras.main.scrollY + pointer.y;
      var toX = Math.floor(x/16);
      var toY = Math.floor(y/16);
      var fromX = Math.floor(self.player.x/16);
      var fromY = Math.floor(self.player.y/16);
      //console.log('going from ('+fromX+','+fromY+') to ('+toX+','+toY+')');

      this.finder.findPath(fromX, fromY, toX, toY, function( path ) {
          if (path === null) {
            console.warn("Path was not found.");
            return
          }
          myself.moveCharacter(path);
      })
      this.finder.calculate(); // don't forget, otherwise nothing happens

      pointer.event.stopPropagation();
    }

    moveCharacter (path){
        let myself = this
        let self = this.scene
      // 设置一个补间列表，每个瓷砖走一个，将由时间轴链接
      var tweens = [];
      for(var i = 0; i < path.length-1; i++){
          var ex = path[i+1].x;
          var ey = path[i+1].y;

          let x = self.map.tileToWorldX(ex,self.cameras.main)
          let y = self.map.tileToWorldY(ey,self.cameras.main)

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