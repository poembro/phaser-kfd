# phaser3游戏引擎开发总结

### 游戏初始化

文档地址：[Phaser.Types.Core.GameConfig](https://newdocs.phaser.io/docs/3.55.2/Phaser.Types.Core.GameConfig)

首先来看一下拍蚊子的初始化配置

```javascript
const game = new Phaser.Game({
  type: Phaser.AUTO, // 指定渲染模式，采用webGL或者canvas进行渲染，Phaser.AUTO为默认值，会优先采用webgl渲染，不支持会自动降级采用canvas进行渲染
  scale: { // 游戏界面适配相关配置，下面会细说
  //https://github.com/photonstorm/phaser/blob/v3.55.2/src/scale/const/SCALE_MODE_CONST.js
    mode: Phaser.Scale.HEIGHT_CONTROLS_WIDTH,//宽度会根据高度自动调整。
    autoCenter: Phaser.Scale.CENTER_BOTH,
    parent: document.querySelector('#game-container'),
    width: 750,
    height: 1206,
  },
  backgroundColor: '#ffffff', // 游戏背景色
  physics: { // 物理引擎
    default: 'arcade', // Phaser当中最常用的物理引擎，如果没有特别的需求，基本用它就能满足需求
    arcade: {
      debug: false, // 开启物理引擎debug模式，设置为true，会显示带有物理属性的游戏对象的物理边界以及运动方向
      gravity: { y: 0 }, // 整个游戏的重力，当然，每个舞台都可以独立进行设置
      fps: 60, // 游戏帧率，这边简单给不爱玩游戏的小伙伴解释一下，它指的是游戏每秒的刷新次数，越高的话就越流畅，反之越卡。但是越高对性能影响越大，设置为60基本就够了。需要注意的是，这边设置的并不是真实的游戏刷新频率，只是会参与到真实刷新频率的计算当中
    },
  },
  input: { // 这个配置和交互功能有关系，比如手指触摸，键盘按键，滑动等等，设置为false为禁止交互。这边放下文档地址https://newdocs.phaser.io/docs/3.55.2/Phaser.Types.Core.InputConfig
    activePointers: 4, // 这个参数主要作用是设置屏幕能感应到的最大的触摸点数目
  },
  scene: MainScene, // 初始化游戏场景，如果只有一个场景直接配置为那个场景类就可以了。但是如果是有多个场景的话，传入数组，默认排列在数组第一个的场景处于激活状态
});
```

### 界面适配

界面适配实际上就是上面游戏过程化过程中的scale参数配置

文档地址：[Phaser.Types.Core.ScaleConfig](https://newdocs.phaser.io/docs/3.55.2/Phaser.Types.Core.ScaleConfig)

|    name    |            default            |                    description                    |
| :--------: | :---------------------------: | :-----------------------------------------------: |
|   width    |             1024              |                     游戏宽度                      |
|   height   |              768              |                     游戏高度                      |
|   parent   |                               |             包裹游戏canvas的`dom`元素             |
|    mode    | Phaser.Scale.ScaleModes.NONE  |                 游戏界面适配模式                  |
| autoCenter | Phaser.Scale.Center.NO_CENTER |                     居中设置                      |
| autoRound  |             false             | 尺寸大小自动取整，设置为true,有助于游戏性能的提高 |

#### mode

文档地址：[Phaser.Scale.ScaleModes](https://newdocs.phaser.io/docs/3.55.2/Phaser.Scale.ScaleModes)

该参数有六种适配模式

|         type          |                         description                          |
| :-------------------: | :----------------------------------------------------------: |
|        ENVELOP        | 自动充满屏幕，等比缩放，有点类似于`css`的`backgroud-size: cover;` |
|          FIT          | 宽高会自动等比例调整尺寸，直到其中之一撑满屏幕，有点类似于`css`的`background-size: contain;` |
| HEIGHT_CONTROLS_WIDTH |                 使高度撑满屏幕，宽度等比缩放                 |
| WIDTH_CONTROLS_HEIGHT |                 使宽度撑满屏幕，高度等比缩放                 |
|        RESIZE         | 无论宽高如何，canvas尺寸都将会根据父级容器进行调整(移动端没啥用) |
|         NONE          |     不进行任何缩放，canvas的大小和配置的游戏宽高保持一致     |

#### autoCenter

文档地址：[Phaser.Scale.Center ](https://newdocs.phaser.io/docs/3.55.2/Phaser.Scale.Center)

|        type         | description  |
| :-----------------: | :----------: |
|     CENTER_BOTH     | 水平垂直居中 |
| CENTER_HORIZONTALLY |   水平居中   |
|  CENTER_VERTICALLY  |   垂直居中   |
|      NO_CENTER      |    不居中    |

根据产品以及设计的需求可知，适配方案需要满足下面要求

1. 不出现白边或者黑边
2. 游戏界面不允许出现变形的情况
3. 不允许遮挡到游戏的有效区域
4. 条件3的优先级高于条件1的优先级

![](.\game.png)

根据上图设计稿可知，整体设计而言，上面的计时以及计分左右有一定的空间，而上下空间较为的小，也就是说，我们的适配方案应当采取遮挡左右空间，保留完整的上下空间的方案。

那么我们结合现有的信息可知，宽750高1206，该设计稿为一个普通屏设计稿，那么不同的适配模式效果是如何的呢？

- ENVELOP: 该方案在全面屏以及普通屏下都能完美的适配，但是在显示区域高宽比例小余1.5的情况下(一般为普通屏手机底部出现虚拟栏或者ios微信下的虚拟导航栏挤占了h5的显示空间导致的)，由于这种情况高度先于宽度撑满，这个时候继续放大，直到宽度撑满，那么上面的有效空间就会被遮挡住，由于不允许遮挡有效区域优先级最高，所以该方案不符合需求
- FIT: 这种方案是类似contain的实现，由于设计稿为普通屏，所以在全面屏下屏幕上下区域会出现白边的情况，该类型不符合需求
- HEIGHT_CONTROLS_WIDTH: 该方案在全面屏以及普通屏下都能符合需求，在高宽比小余1.5的情况下左右会出现白边，但是不会出现遮挡有效显示区域。该方案基本符合要求，待定。
- WIDTH_CONTROLS_HEIGHT: 由于设计稿为普通屏，宽度撑满，高度自适应，在全面屏下必定会出现上下有效显示空间被遮挡的情况，该方案不符合要求。

那么我们最终采取的方案就是`HEIGHT_CONTROLS_WIDTH`了，虽然还不能算完美，但是也能做到在特殊情况下拥有较好的体验了。

至于居中，我们目前的方案是高度撑满，宽度自适应，所以这边采用水平垂直居中，或者仅仅是水平居中都可以。这个一般没特殊要求的话，无脑选`CENTER_BOTH`进行水平垂直居中就好了

### 生命周期

文档：[Phaser.Types.Scenes](https://newdocs.phaser.io/docs/3.52.0/Phaser.Types.Scenes)

与我们常用的框架类似，Phaser也有生命周期这个概念，它的生命周期有四个，分别是:

- **init**: 当场景实例初始化的时候执行
- **preload**: 预加载，一般用于当前场景下资源的加载
- **create**: 场景创建完成，这个时候资源已经经过预加载，可以在此周期下进行界面元素的创建
- **update**：游戏界面刷新的回调，类似于一个定时器，可以在里面执行游戏相关逻辑

### 资源加载

文档：[Phaser.Loader.LoaderPlugin](https://newdocs.phaser.io/docs/3.52.0/Phaser.Loader.LoaderPlugin)

所有在游戏当中需要用到的资源，例如图片，音频，纹理图集，骨骼动画描述文件等等都是需要先在预加载生命周期当中进行加载后才能在游戏当中使用。

目前来说，常用的资源就是image, audio, atlas

```javascript
// 下面的this指向的是当前的scene实例
this.load.image('bg', 'images/bg.png'); // 加载图片资源
this.load.image('mosquito', 'images/mosquito.png');
this.load.audio('bgMusic', 'audio/bg.mp3'); // 加载音频
this.load.atlas('monsterAtlas', 'atlas/monster.png', 'atlas/monster.json'; // 加载纹理图集
// ...
```



### 游戏对象

文档：[Game Objects](https://newdocs.phaser.io/docs/3.55.2/gameobjects)

游戏对象就是用于添加游戏当中的各种元素，例如image, sprite, container, group等等

- image: 它是一个轻型游戏对象，可用于在游戏中显示静态图像，例如标签，背景，或其他非动画元素。 图像可以具有交互事件和物理属性。 它和Sprite之间的主要区别在于无法为image添加动画，因为它们没有动画组件。

  ```javascript
  // this指向当前scene实例，需要注意的是，Phaser当中默认锚点为中心点
  this.add.image(0, 0, 'bg').setOrigin(0, 0);
  ```

- sprite: 它用于显示游戏中的静态和动画图像。 可以有输入事件和物理属性。 如果不需要动画，那么可以使用image来替换它。

  ```javascript
  // 这个是最基础的用法，通过一个图片资源加载sprite
  const mosquito =  this.add.sprite(0, 0, 'mosquito');
  // 这是一个通过纹理图集加载sprite对象的例子，后面通过调用play来执行一个预先定义好的动画
  const monster1 = this.add.sprite(0, 0, 'monsterAtlas', 'monsters/monster1.png').play('run');
  ```

- tileSprite: 它可以用来生成一个循环滚动的图像，可以用来制作运动状态下的游戏背景

  ```javascript
  {
      preload() {
        this.load.image('bg', 'assets/bg.png');  
      },
      create() {
          // 创建一个瓦片背景
          this.tileBg = this.add.tileSprite(0, 0, 750, 1206, 'bg');
      },
      update() {
          // 瓦片背景横向滚动
          this.tileBg.tilePositionX += 6;
      }
  }
  ```

- text: 用于添加文本

  ```javascript
  const helloText = this.add.text(0, 0, 'hello world', {
      fill: '#000000',
      fontSize: '28px',
      fontStyle: 'bold',
  });
  ```

- container: 在phaser2的时候，用的是pixi，它是允许直接往一个游戏对象里面添加子元素的，但是phaser3就不能这么做的。所以增加了一个container对象，这个对象有点类似于div标签的作用，可以往里面添加游戏元素，用来对游戏元素进行分组。当一个游戏对象加入container对象的时候，就会自动相对于container进行定位

  ```javascript
  const container = this.add.container(this, 0, 0);
  
  container.add([mosquito, monster1])
  ```

- group: 它于container类似，也是一个分组的作用，不过它是为了对分组元素执行一致的逻辑而存在的。

  ```javascript
  // 如下，我新建了一个组，然后往里面添加了三个元素，接着直接对分组执行setAlpha将三个元素的透明度都置为0
  const mosquitoGroup = this.add.group();
  
  mosquitoGroup.add(mosquito1, mosquito2, mosquito3);
  mosquitoGroup.setAlpha(0);
  ```

- sound: 这边要说一下sound，它是用于添加音频的，不过却是挂载在scene下面而不是GameObjects中

  文档: [sound](https://newdocs.phaser.io/docs/3.52.0/Phaser.Scene#sound)

  ```javascript
  // this指向当前scene实例，下面是一个添加背景音乐循环播放的例子
  this.sound.play('bgMusic', { loop: true });
  ```

上面简单介绍了一些比较常见的游戏对象，除此之外，phaser还提供了大量的游戏对象创建方法，它们拥有在游戏当中创建各种图形等等功能

### 对象属性

- active: 当前游戏对象是否处于活动状态
- alpha: 透明度
- angle: 旋转角度，phaser当中采取的是顺时针旋转
- body: 如果一个游戏对象开启了物理特性，那么body属性下将挂载上例如速度，引力，碰撞反弹系数，检测是否与世界产生碰撞等物理属性或者方法等。
- depth: 游戏对象在场景当中的层级，类似于css当中z-index的作用
- displayHeight: 游戏对象在界面当中显示的真实高度，它将会把缩放等属性影响考虑进去
- displayWidth: 与displayHeight一样，它的值为界面当中显示的真实宽度
- flipX: 围绕X轴翻转
- flipY: 围绕Y轴翻转
- height: 对象的高度，设置该对象并不能改变游戏对象的高度，如果需要改变可以使用scaleY或者displayHeight进行修改
- originX: 水平方向上的锚点
- originY: 垂直方向的锚点
- scale: 控制游戏对象进行缩放，将水平和垂直方向的缩放值设置为一个值
- scaleX: 水平方向进行缩放
- scaleY: 垂直方向进行缩放
- scene: 它是游戏对象当前所在场景实例的引用
- visible: 游戏对象是否可见，它是一个布尔值，功能与css属性visibility类似，true为visible，false为hidden
- width: 类似于height属性
- x: 游戏对象的锚点在X轴上所在位置
- y: 同上
- ..........

### 对象方法

- destroy: 销毁当前游戏对象
- disableInteractive: 禁止游戏对象进行交互事件
- getCenter: 获取游戏中心点坐标，它于锚点无关，此外getBottomCenter、 getBottomLeft、 getBottomRight, getLeftCenter等也是类似功能用于获取游戏对象特定点位的坐标
- off: 取消对特定事件的监听
- on: 监听某一个事件
- once: 与on一样用于监听事件，但是它只会监听一次
- play: 播放动画，该方法只有在sprite对象上有
- setActive: 设置游戏对象激活状态，setAlpha, setAngle, setDepth等都是类似功能，用于设置游戏的属性，推荐通过方法来进行设置，而不是直接对属性进行修改，直接修改的方式，在属性是只读的，直接修改属性不会生效
- setPosition: 对游戏对象的坐标进行修改
- setSize: 对游戏对象的宽高进行修改
- stop: 停止播放当前动画
- setInteractive: 启用当前对象交互事件
- ...........

### 动画实现

#### 帧动画

由于在phaser当中是不能直接使用gif类型的图片的，所以需要通过代码的方式来实现帧动画，这样的实现也方便对动画的执行进行控制。

文档: [Phaser.Animations.AnimationManager](https://newdocs.phaser.io/docs/3.55.1/Phaser.Animations.AnimationManager#create)

示例:

```javascript
{
    preload() {
        // 加载纹理图集，类似于雪碧图，但是它多了一个描述图里面每个小图片的位置大小信息的json文件
        this.load.atlas('walker', 'assets/animations/walker.png', 'assets/animations/walker.json');
    },
    create() {
        const animConfig = {
            key: 'walk', // 动画的键名
            frames: 'walker', // 写入优先建在好的纹理图集资源，这边使用walker，该参数还可以使用单张图片，传入一个图片数组即可
            frameRate: 60, // 动画帧率
            repeat: -1 // 动画重复次数，为-1时无限循环
            // delay: 1000, // 延迟执行，单位为毫秒
            // repeatDelay: 1000, // 每次动画重复执行之前的延时
            // yoyo: true, 动画是否反向执行，类似css设置 animation-direction:alternate;
        };
        // 传入配置，创建动画
        this.anims.create(animConfig);
        // 生成一个精灵对象
        const sprite = this.add.sprite(0, 0, 'walker', 'frame_0000');
        // 让这个精灵跑起来
        sprite.play('walk');
    }
}
```

以上示例是针对一个纹理图集对应一个动画的情况。但是如果一个纹理图集里面含有多个动画，那么就需要借助generateFrameNames和generateFrameNumber辅助方法来返回对应的帧了。

generateFrameNumber主要用于通过雪碧图生成动画的场景

![](.\dude.png)

```javascript
{
    preload() {
        // 加载一个雪碧图, 相比于纹理图集需要一个信息描述的json文件，雪碧图没那么复杂，但是里面的小图片大小必须是一样的
        this.load.spritesheet('dude', 'assets/dude.png', { frameWidth: 32, frameHeight: 48 }); // 每个小图的大小为32 * 48
    },
    create() {
        this.anims.create({
            key: 'left',
            frames: this.anims.generateFrameNumbers('dude', { start: 0, end: 3 }), // 定义向左跑动动画，为第1到4帧
            frameRate: 10,
            repeat: -1
        });
        this.anims.create({
            key: 'turn',
            frames: [ { key: 'dude', frame: 4 } ], // 定义站立动画，为第5帧
            frameRate: 20
        });

        this.anims.create({
            key: 'right',
            frames: this.anims.generateFrameNumbers('dude', { frames: [5, 6, 7, 8] }), // 指定帧定义向右跑动动画，为第6到9帧
            frameRate: 10,
            repeat: -1
        });
    }
}
```

相比于generateFrameNumber，generateFrameNames要复杂一些，它是通过一定的特征来描述需要用到的帧图，来返回一组序列帧

文档: [Phaser.Types.Animations.GenerateFrameNames](https://newdocs.phaser.io/docs/3.55.2/Phaser.Types.Animations.GenerateFrameNames)

示例:

```javascript
{
    preload () {
        this.load.atlas('knight', 'assets/animations/knight.png', 'assets/animations/knight.json');
    }

    create () {
        this.anims.create({
            key: 'guardStart',
            frames: this.anims.generateFrameNames('knight', { prefix: 'guard_start/frame', start: 0, end: 3, zeroPad: 4 }),
            frameRate: 8
        });

        this.anims.create({
            key: 'guard',
            frames: this.anims.generateFrameNames('knight', { prefix: 'guard/frame', start: 0, end: 5, zeroPad: 4 }),
            frameRate: 8,
            repeat: 2
        });

        this.anims.create({
            key: 'guardEnd',
            frames: this.anims.generateFrameNames('knight', { prefix: 'guard_end/frame', start: 0, end: 3, zeroPad: 4 }),
            frameRate: 8
        });

        this.anims.create({
            key: 'idle',
            frames: this.anims.generateFrameNames('knight', { prefix: 'idle/frame', start: 0, end: 5, zeroPad: 4 }),
            frameRate: 8,
            repeat: -1
        });
    }
}
```

#### 骨骼动画

它是一种计算机动画技术，它将三维模型分为两部份：用于绘制模型的蒙皮，以及用于控制动作的骨架。跟传统帧动画相异，骨骼动画利用建立好的骨架套用到一张或多张图片，使之动作，比起一般一张一张绘出动作省了很多时间与精力，且能更生动的动作。

它相比于帧动画来说，图片资源更小，但是它会对设备的性能要求更高。

![](.\atlas1.png)

由于目前来说公司的游戏需求比较少，所以暂时没有可以制作骨骼动画同事配合，基本上现在都是使用帧动画来实现，这边就不多介绍了。

#### 补间动画

文档: 

- [Phaser.Tweens.TweenManager](https://newdocs.phaser.io/docs/3.55.1/Phaser.Tweens.TweenManager)
- [Phaser.Types.Tweens.TweenBuilderConfig](https://newdocs.phaser.io/docs/3.55.1/Phaser.Types.Tweens.TweenBuilderConfig)

示例:

```javascript
{
    preload() {
        this.load.image('block', 'assets/sprites/block.png');
    },
    create() {
        const image = this.add.image(100, 100, 'block');

        const tween = this.tweens.add({
            targets: image, // 执行动画的游戏对象
            x: 600, // 运动到x坐标为600的位置
            ease: 'Power1', // 动画执行的缓动函数
            duration: 3000, // 动画持续时间
            delay: 2000, // 执行动画之前的延迟
            yoyo: true, // 动画是否反向执行，类似css设置 animation-direction:alternate;
            repeat: 2, // 动画重复次数
            hold: 1000, // 当设置了yoyo后，执行返回动画前的延迟时间
            repeatDelay: 1000, // 重复动画之前的等待时间
        });
    }
}
```

下面是所有的缓动动画类型

```
'Linear','Quad.easeIn','Cubic.easeIn','Quart.easeIn','Quint.easeIn','Sine.easeIn','Expo.easeIn','Circ.easeIn','Back.easeIn','Bounce.easeIn','Quad.easeOut','Cubic.easeOut','Quart.easeOut','Quint.easeOut','Sine.easeOut','Expo.easeOut','Circ.easeOut','Back.easeOut','Bounce.easeOut','Quad.easeInOut','Cubic.easeInOut','Quart.easeInOut','Quint.easeInOut','Sine.easeInOut','Expo.easeInOut','Circ.easeInOut','Back.easeInOut','Bounce.easeInOut'
```

### 碰撞检测

碰撞检测有两种，分别为`overlap`和`collide`, overlap只会检查是否发生触碰，collide不同的地方在于，通过collide进行检查的两个对象，进行检测的两个对象会产生一种碰撞效果，无法重叠在一起。

文档：

- [overlap](https://newdocs.phaser.io/docs/3.55.1/Phaser.Physics.Arcade.ArcadePhysics#overlap)
- [collide](https://newdocs.phaser.io/docs/3.55.1/Phaser.Physics.Arcade.ArcadePhysics#collide)

示例:

```javascript
{
	preload() {
		this.load.image('ground', 'assets/ground.png');
		this.load.image('dude', 'assets/dude.png');
		this.load.image('star', 'assets/star.png');
	},
	create() {
        // 这边生成了游戏角色，地面，星星
		const dude = this.add.sprite(0, 0, 'dude');
        const ground = this.add.image(0, 0, 'ground');
        const star = this.add.image(0, 0, 'star');
        // 不允许穿过世界边界
        dude.setCollideWorldBounds(true);
        // 使用collide让游戏角色能够站在地面上
        this.physics.add.collide(dude, ground);
        this.physics.add.image(0, 0, 'dude')
        // 使用overlap来检测角色是否得分，第三个是检测到重叠的回调函数，两个参数分别是产生碰撞的两个对象
        this.physics.add.overlap(dude, star, (dude, star) => {
            alert('dude吃到星星啦');
        });
	}
}
```

进行碰撞检测的对象可以是一个对象，也可以是一个group组

### 物理特性

当你创建了一个带有物理属性的对象之后，它就会拥有一些物理属性与方法。

文档: [Phaser.Physics.Arcade.Body](https://newdocs.phaser.io/docs/3.55.2/Phaser.Physics.Arcade.Body)

|     属性      |                   描述                    |
| :-----------: | :---------------------------------------: |
| allowGravity  |  游戏当中设置的重力是否会对物体产生效果   |
|   allowDrag   |           是否会受到阻力的影响            |
|    enable     |     当他为false的时候，物理特性将失效     |
|     width     |            物理特性边界的宽度             |
|    height     |            物理特性边界的高度             |
|       x       |            物理特性边界的x坐标            |
|       y       |            物理特性边界的y坐标            |
|   onCollide   |    当它为false的时候，不会发生碰撞检测    |
|   onOverlap   |    当它为false的时候，不会发生重叠检测    |
| onWorldBounds | 当它为false的时候，不会与世界边界发生碰撞 |
|  maxVelocity  |                 最大速度                  |
|   velocity    |                 移动速度                  |

|       方法       |                             描述                             |
| :--------------: | :----------------------------------------------------------: |
|     destroy      |                         消除物理特性                         |
|      reset       |               传入坐标值，重置物理特性边界坐标               |
|    setCircle     |                  设置一个圆形的物理特性边界                  |
|     setSize      |                    设置物理特性边界的宽高                    |
|    setBounce     |                         设置碰撞系数                         |
|   setVelocity    | 设置速度，setVelocityX与setVelocityY作用一样，不过他们只能设置一个方向的速度 |
| checkWorldBounds |       检测是否与世界边界发生碰撞，若发生碰撞则返回true       |

### 事件交互

文档: [Phaser.Input.InputPlugin](https://newdocs.phaser.io/docs/3.55.1/Phaser.Input.InputPlugin)

当需要处理用户交互行为的时候，就需要用到input对象了，它可以监听用户操作，并执行对应的逻辑。

首先，在当前场景下进行事件监听

```javascript
// this指向当前场景实例
this.input.on("pointerdown", (pointer) => {
    console.log(`屏幕被点击了！点击坐标为x: ${pointer.x}, y: ${pointer.y}`);
});
```

首先，在当前场景下按键抬起事件 播放动画

```javascript
    this.scene.input.keyboard.addListener("keyup", (e)=>{ // keydown 表示按下事件
        this.anims.play("turn", true);
    }, this)
```

游戏对象的事件监听

```javascript
// 创建一个游戏对象
var player = this.add.sprite(0, 0, 'player');
// 允许对当前对象进行事件监听
player.setInteractive();
// 监听player是否被点击
player.on('pointerdown', () => {
    console.log('player被点击了！')
});
```













