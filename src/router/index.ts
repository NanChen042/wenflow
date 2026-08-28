import { createRouter, createWebHistory } from 'vue-router'
const HomeView = () => import('../views/HomeView.vue')
const ChatView = () => import('../views/ChatView.vue')

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/',
      name: 'home',
      component: HomeView,
      meta: {
        keepAlive: true
      }
    },
    {
      path: '/chat',
      name: 'chat',
      component: ChatView,
      meta: {
        keepAlive: true
      }
    }
  ],
})

export default router
