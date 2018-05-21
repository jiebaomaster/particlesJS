import Particles from './particles'

export default {
  install(Vue, options = {}) {
    Vue.directive('particles', {
      // 被绑定元素插入父节点时调用 (仅保证父节点存在，但不一定已被插入文档中)。
      inserted: function(el, binding) {
        // 配置参数
        let config = binding.value

        // 新建粒子特效画布实例
        let particles = new Particles(el.id, config)

        // 动画开始
        particles.start()
      }
    })
  }
}