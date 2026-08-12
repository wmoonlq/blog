<template>
  <header class="nav">
    <div class="nav-inner">
      <router-link class="nav-brand" :to="{ name: 'home' }">wmoonlq · Blog</router-link>
      <nav class="nav-links">
        <router-link class="nav-link" :to="{ name: 'home' }">文章</router-link>
        <router-link class="nav-link" :to="{ name: 'workbench' }">工作台</router-link>
        <router-link class="nav-link" :to="{ name: 'effects' }">特效</router-link>
      </nav>
    </div>
  </header>
</template>
