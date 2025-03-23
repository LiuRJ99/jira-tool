<template>
  <div class="about">
    <h1>This is an about page</h1>
  </div>
</template>

<style scoped>
.about {
  padding: 20px;
  max-width: 1200px;
  margin: 0 auto;
}

h1 {
  font-size: 28px;
  color: #262626;
  text-align: center;
  margin-bottom: 40px;
}

/* 移动端样式 */
@media screen and (max-width: 767px) {
  .about {
    padding: 10px;
  }

  h1 {
    font-size: 24px;
    margin-bottom: 20px;
  }
}

/* 平板样式 */
@media screen and (min-width: 768px) and (max-width: 1023px) {
  .about {
    max-width: 90%;
    padding: 15px;
  }

  h1 {
    font-size: 26px;
  }
}

/* 桌面端样式 */
@media screen and (min-width: 1024px) {
  .about {
    min-height: 100vh;
    display: flex;
    align-items: center;
    justify-content: center;
  }
}
</style>
