import {
  requestAnimFrame,
  cancelRequestAnimFrame
} from './utils'

// 画图
class Paint {
  // 画圆
  _drawCircle(param) {
    let ctx = this.ctx

    ctx.save()
    ctx.fillStyle = this.config.particles.color.value
    ctx.strokeStyle = this.config.particles.shape.stroke.color
    ctx.lineWidth = this.config.particles.shape.stroke.width
    ctx.beginPath()
    ctx.arc(param.x, param.y, param.radius, 0, Math.PI * 2)
    ctx.closePath()
    ctx.fill()
    ctx.stroke()
    ctx.restore()
  }

  // 画图片
  _drawImg(param) {
    let ctx = this.ctx
    let shapeConfig = this.config.particles.shape

    let width = shapeConfig.img.width // 图片宽度
    let height = shapeConfig.img.height // 图片高度
    let img = new Image() // 新建图片
    img.src = shapeConfig.img.src

    ctx.save()
    ctx.strokeStyle = shapeConfig.stroke.color
    ctx.lineWidth = shapeConfig.stroke.width
    let ptrn = ctx.createPattern(img, 'repeat')
    ctx.fillStyle = ptrn
    ctx.fill(param.x, param.y, width, height)
    ctx.stroke()
    ctx.restore()
  }

  // 画任意多边形
  _drawPolygon(ctx) {}

  /**
   * 两个点之间连线
   * @param {number} x1 
   * @param {number} y1 
   * @param {number} x2 
   * @param {number} y2 
   */
  _drawLine(x1, y1, x2, y2) {
    let ctx = this.ctx

    ctx.save()
    ctx.strokeStyle = this.config.particles.line.color
    ctx.lineWidth = this.config.particles.line.width
    ctx.beginPath()
    ctx.moveTo(x1, y1)
    ctx.lineTo(x2, y2)
    ctx.closePath()
    ctx.stroke()
    ctx.restore()
  }
}

// 星夜
class ParticlesJS extends Paint {
  /**
   * @param {string} targetEleId 目标元素id
   * @param {object} config 配置选项
   */
  constructor(targetEleId = '', config = {}) {
    super()

    let defaultConfig = { // 默认设置对象
      'particles': { // 粒子设置
        'number': { // 粒子数量
          'value': 100
        },
        'color': { // 粒子颜色
          'value': '#ffffff'
        },
        'size': { // 粒子大小
          'value': 2,
          'random': false // 是否随机
        },
        'shape': { // 粒子形状
          'type': 'circle', // 形状类型，['circle', 'polygon', 'img', 'star']
          'stroke': { // 轮廓
            'width': 1,
            'color': '#ffffff'
          },
          'polygon': { // 粒子形状设置为多边形时的设置
            'nb_sildes': 0 // 边数
          },
          'img': { // 粒子形状设置为图片时设置
            'src': '', // 地址
            'width': 100,
            'height': 100
          }
        },
        'line': { // 粒子间的连线
          'enable': true, // 是否连线
          'distance': 100, // 距离
          'color': '#ffffff', // 颜色
          'opacity': 1, // 透明度，0-1
          'width': 1, // 宽度
        },
        'move': { // 粒子移动
          'enable': true,
          'speed': 2, // 随机速度的基数
          'random': false, // 是否随机速度
          'straight': false, // 是否直接移动，即不用任何随机数
          'direction': '', // 移动的方向，[]
          'out_mode': 'bounce', // 是否移出画布，[out, bounce]，bounce模式下粒子遇到边界会反弹
        }
      },
    }

    // 如果用户设置不是一个对象则将它转换成空对象
    if (Object.prototype.toString.call(config) !== '[object Object]') {
      config = {}
    }

    // 将用户设置和默认设置合并
    this.config = Object.assign({}, defaultConfig, config)

    /**
     *  在选中元素下创建一个canvas画布
     */
    let targetEle = document.getElementById(targetEleId)
    if (!targetEle) { // 目标元素不存在时退出
      console.warn('目标元素不存在')
      return
    }
    targetEle.innerHTML = '' // 清空根元素
    let canvasEle = document.createElement('canvas') // 在目标元素下新建canvas元素

    // canvas的大小充满整个父元素
    canvasEle.style.width = '100%'
    canvasEle.style.height = '100%'

    // 插入canvas元素
    targetEle.appendChild(canvasEle)

    // 画布的大小设置为父元素的大小
    canvasEle.width = canvasEle.offsetWidth
    canvasEle.height = canvasEle.offsetHeight

    this._canvasEle = canvasEle
    this.w = canvasEle.width // 画布的宽
    this.h = canvasEle.height // 画布的高
    this.ctx = canvasEle.getContext('2d')

    // 创建粒子
    this.particles = []
    let num = this.config.particles.number.value
    for (let i = 0; i < num; i++) {
      this.particles.push(this.initParticle())
    }
  }

  emptyParticle() { // 清空粒子库
    this.particles = []
  }

  /**
   * 初始化一个粒子
   * @param {Object} position 粒子在画布中的位置
   */
  initParticle(position) {
    let particle = {
      x: 0, // 中心点横坐标
      y: 0, // 中心点纵坐标
      vx: 0, // 中心点横速度
      vy: 0, // 中心点纵速度
      radius: 0 // 大小
    }

    // 初始坐标
    particle.x = position ? position.x : Math.random() * this.w
    particle.y = position ? position.y : Math.random() * this.h

    // 初始速度
    // todo 支持配置移动方向
    let moveConfig = this.config.particles.move
    particle.vx = moveConfig.speed
    particle.vy = moveConfig.speed // 中心点横速度
    if (!moveConfig.straight) {
      if (moveConfig.random) {
        particle.vx = particle.vx * Math.random()
        particle.vy = particle.vy * Math.random()
      } else {
        particle.vx = particle.vx + (Math.random() - 0.5) * moveConfig.speed
        particle.vy = particle.vy + (Math.random() - 0.5) * moveConfig.speed
      }
    }

    // 初始化大小
    let sizeConfig = this.config.particles.size
    particle.radius = sizeConfig.value
    if (sizeConfig.random) {
      particle.radius = particle.radius * Math.random()
    }

    return particle
  }

  draw(param) {
    let type = this.config.particles.shape.type
    switch (type) {
      case 'img':
        this._drawImg(param)
        break
      case 'polygon':
        this._drawPolygon(param)
        break
      case 'circle':
      default:
        this._drawCircle(param)
    }
  }

  move() {
    let particlesConfig = this.config.particles
    this.ctx.clearRect(0, 0, this.w, this.h) // 清空画布
    console.log(this.w, this.h)

    // 移动每个点
    let num = particlesConfig.number.value // 点的个数
    for (let i = 0; i < num; i++) {
      let p = this.particles[i]

      // 按给定的速度移动粒子
      p.x += p.vx
      p.y += p.vy

      // todo 支持粒子移出画布外
      // 在画布外的粒子改变位置
      if (particlesConfig.move.out_mode === 'bounce') {

      } else {

      }

      // 若超出画布外的运动模式为'反弹'，则将超过画布范围的粒子反向移动
      if (particlesConfig.move.out_mode === 'bounce') {
        // 
        if (p.x + p.radius > this.w || p.x - p.radius < 0) {
          p.vx = -p.vx
        }
        if (p.y + p.radius > this.h || p.y - p.radius < 0) {
          p.vy = -p.vy
        }
      }

      // 重绘该粒子
      this.draw(p)

      // 相邻的粒子两两连线
      if (particlesConfig.line.enable) {
        /**
         * 1. a与b的连线和b与a的连线相同，防止遍历两遍
         * 2. 从大到小遍历，和已移动的粒子连线
         */
        for (let j = i - 1; j >= 0; j--) {
          let pj = this.particles[j]
          let distance = Math.pow(p.x - pj.x, 2) + Math.pow(p.y - pj.y, 2)

          // 如果两个点之间的距离小于配置中的距离最大值，则连一条线
          if (distance < Math.pow(particlesConfig.line.distance, 2)) {
            this._drawLine(p.x, p.y, pj.x, pj.y)
          }
        }
      }
    }
  }

  /**
   * 开始动画
   * @param {boolean} useRequestAnimationFrame 是否使用requestAnimationFrame函数动画
   * @param {number} time 在使用setInterval函数动画的情况下，重复时间间隔
   */
  start(time = 16) {

    // 浏览器大小改变时改变画布的大小
    window.addEventListener('resize', () => {
      this.w = this._canvasEle.offsetWidth
      this.h = this._canvasEle.offsetHeight

      this._canvasEle.width = this.w
      this._canvasEle.height = this.h
    })

    // 开始动画
    let animateHandle = this.move.bind(this) // 显式绑定this，防止在动画函数中执行时丢失this    

    let animate = function() {
      animateHandle()
      requestAnimFrame(animate)
    }
    requestAnimFrame(animate)
  }
}

export default ParticlesJS