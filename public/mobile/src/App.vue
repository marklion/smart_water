<script>
export default {
  methods: {
    applyStatusBarStyle() {
      // 仅在 App 端生效，强制状态栏可见并设置对比色
      // #ifdef APP-PLUS
      if (typeof plus !== 'undefined' && plus.navigator) {
        try {
          plus.navigator.setFullscreen(false)
          plus.navigator.setStatusBarStyle('light')
          plus.navigator.setStatusBarBackground('#2F3A4A')
        } catch (e) {
          console.error('设置状态栏失败:', e)
        }
      }
      // #endif
    }
  },
  onLaunch: function () {
    console.log('App Launch')
    // #ifdef APP-PLUS
    if (typeof plus === 'undefined') {
      document.addEventListener('plusready', () => {
        this.applyStatusBarStyle()
      }, { once: true })
    } else {
      this.applyStatusBarStyle()
    }
    // #endif
  },
  onShow: function () {
    console.log('App Show')
    this.applyStatusBarStyle()
  },
  onHide: function () {
    console.log('App Hide')
  },
}
</script>

<style>
/*每个页面公共css */
html,
body,
#app {
  height: 100%;
  overflow: hidden;
}

uni-page,
uni-page-wrapper,
uni-page-body {
  height: 100%;
  overflow: hidden !important;
}
</style>
