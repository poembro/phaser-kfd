import kingPNG from "./assets/sprites/king.png";


import kingAtlasPNG from "./assets/spritesheets/a-king_withmask.png";
import kingAtlasJSON from "./assets/spritesheets/a-king_atlas.json";


import lizardAtlasPNG from "./assets/spritesheets/lizard.png";
import lizardAtlasJSON from "./assets/spritesheets/lizard.json";

import GrassPNG from "./assets/tilemaps/json/Grass.png";
 
// tiled 软件导出的json 地图
import GrassJSON from "./assets/tilemaps/json/Grass.json";


import backgroundPNG from "./assets/spritesheets/background.png"
import foodPNG from "./assets/spritesheets/food.png"


import {SocketServer} from './lib/net/SocketServer';

export class LoadingScene extends Phaser.Scene {

    SocketServer = null

    constructor() {
        super("LoadingScene")
    }

    preload() {
        //this.load.baseURL = "http://localhost:8080/assets/";
        this.load.image("king", kingPNG);

        // 加载图集：.atlas(key [, textureURL] [, atlasURL] [, textureXhrSettings] [, atlasXhrSettings])
        this.load.atlas("a-king", kingAtlasPNG, kingAtlasJSON) // 玩家
        this.load.atlas("lizard", lizardAtlasPNG,lizardAtlasJSON) // 蜥蜴 

        // MAP LOADING
        this.load.image("Grass", GrassPNG)// 图块图片。 
     
        // 读取assets/sprites/fire.json文件，并命名为fire，第三个参数则是图片的路径
        // this.load.multiatlas('fire', 'assets/sprites/fire.json', 'assets/sprites')


        this.load.tilemapTiledJSON("GrassJson", GrassJSON);
    
        this.load.spritesheet("background", backgroundPNG, {frameWidth: 64, frameHeight: 16})
        this.load.spritesheet("food", foodPNG, {frameWidth: 32, frameHeight: 32})
    }

    create() {
        this.SocketServer = new SocketServer()

        this.scene.start("BasicsScene", {name: "GrassJson"})
        this.scene.start("UIScene", {name: "GrassJson"})

    }
}
