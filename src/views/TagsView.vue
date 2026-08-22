<script setup>
import { computed, ref } from 'vue'
import { getAllPosts } from '../utils/posts'
import PageHero from '../components/PageHero.vue'
import GroupLabel from '../components/GroupLabel.vue'

const posts = computed(() => getAllPosts())
const activeTag = ref('')

const tagCounts = computed(() => {
  const map = new Map()
  posts.value.forEach((p) => p.tags.forEach((t) => map.set(t, (map.get(t) || 0) + 1)))
  return [...map.entries()].sort((a, b) => b[1] - a[1])
})

const totalTags = computed(() => tagCounts.value.length)

const activePosts = computed(() => {
  if (!activeTag.value) return []
  return posts.value.filter((p) => p.tags.includes(activeTag.value))
})

function select(tag) {
  activeTag.value = activeTag.value === tag ? '' : tag
}
</script>

<template>
  <div class="page">
    <PageHero
      title="标签"
      :sub="`${totalTags} 个标签，把散落的文章串成线`"
    />
    <div class="tag-cloud">
      <button
        v-for="[tag, count] in tagCounts"
        :key="tag"
        class="tag-cloud-link"
        :class="{ on: activeTag === tag }"
        :style="{ fontSize: `${13 + Math.min(count, 8) * 1.2}px` }"
        @click="select(tag)"
      >
        {{ tag }}
        <span class="tag-cloud-count">{{ count }}</span>
      </button>
    </div>
    <section v-if="activePosts.length" class="tag-section">
      <GroupLabel :label="activeTag" :count="activePosts.length" />
      <ul class="tag-posts">
        <li v-for="post in activePosts" :key="post.slug" class="tag-post">
          <router-link class="tag-post-link" :to="{ name: 'post', params: { slug: post.slug } }">
            <span>{{ post.title }}</span>
            <span class="tag-post-arrow">→</span>
          </router-link>
          <time class="tag-post-date">{{ post.date }}</time>
        </li>
      </ul>
    </section>
  </div>
</template>