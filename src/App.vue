<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import tasksData from './data/tasks.json'
import productsData from './data/products.json'
import managerNotesData from './data/managerNotes.json'

type Task = {
  id: string
  title: string
  location: string
  notes: string | null
  priority: 'must-do' | 'as-time-allows'
  status: 'pending' | 'in-progress' | 'done'
  relatedSku: string | null
  carriedOver: boolean
}

type Product = {
  id: string
  name: string
  sku: string
  aisle: string
  bay: string
  stockStatus: 'In Stock' | 'Low' | 'Out'
  lastRestocked: string
}

type ManagerNote = {
  id: string
  timestamp: string
  text: string
}

const tasks = ref<Task[]>(tasksData as Task[])
const products = ref<Product[]>(productsData as Product[])
const managerNotes = ref<ManagerNote[]>(managerNotesData as ManagerNote[])
const currentView = ref<'tasks' | 'search' | 'report' | 'notes'>('tasks')
const searchQuery = ref('')
const selectedProduct = ref<Product | null>(null)
const showBottomSheet = ref(false)
const issueForm = ref({
  type: '',
  location: '',
  notes: '',
})
const showToast = ref(false)
const toastText = ref('')
const expandedTaskIds = ref<string[]>(['task-101'])
const showHandoffModal = ref(false)
const handoffNotes = ref<Record<string, string>>({})
const noteCharCount = computed(() => issueForm.value.notes.length)
const issueFormValid = computed(() => !!issueForm.value.type && !!issueForm.value.location.trim())

const todayDate = new Date().toLocaleDateString('en-US', {
  weekday: 'short',
  month: 'short',
  day: 'numeric',
})

const mustDoTasks = computed(() =>
  tasks.value.filter((task) => task.priority === 'must-do' && task.status !== 'done'),
)

const asTimeAllowsTasks = computed(() =>
  tasks.value.filter((task) => task.priority === 'as-time-allows' && task.status !== 'done'),
)

const completedTasks = computed(() => tasks.value.filter((task) => task.status === 'done'))
const uncompletedTasks = computed(() => tasks.value.filter((task) => task.status !== 'done'))

const filteredProducts = computed(() => {
  const query = searchQuery.value.trim().toLowerCase()
  if (!query) return products.value

  return products.value.filter(
    (product) =>
      product.name.toLowerCase().includes(query) || product.sku.toLowerCase().includes(query),
  )
})

const navItems = [
  { id: 'tasks', label: 'Tasks', icon: '✓' },
  { id: 'search', label: 'Search', icon: '⌕' },
  { id: 'report', label: 'Report', icon: '!' },
  { id: 'notes', label: 'Notes', icon: '✎' },
] as const

function statusColor(status: string) {
  if (status === 'done' || status === 'In Stock') return '#16A34A'
  if (status === 'in-progress' || status === 'Low') return '#D97706'
  return '#DC2626'
}

function toggleTask(taskId: string) {
  const exists = expandedTaskIds.value.includes(taskId)
  expandedTaskIds.value = exists
    ? expandedTaskIds.value.filter((id) => id !== taskId)
    : [...expandedTaskIds.value, taskId]
}

function markTaskStatus(taskId: string, nextStatus: 'pending' | 'in-progress' | 'done') {
  const target = tasks.value.find((task) => task.id === taskId)
  if (!target) return

  target.status = nextStatus

  if (nextStatus === 'done') {
    const index = expandedTaskIds.value.indexOf(taskId)
    if (index >= 0) expandedTaskIds.value.splice(index, 1)
  }
}

function revertTask(taskId: string) {
  markTaskStatus(taskId, 'pending')
  const index = expandedTaskIds.value.indexOf(taskId)
  if (index === -1) {
    expandedTaskIds.value.push(taskId)
  }
}

function openProductSheet(product: Product) {
  selectedProduct.value = product
  showBottomSheet.value = true
}

function closeProductSheet() {
  showBottomSheet.value = false
  selectedProduct.value = null
}

function flagForRestock() {
  showToastMessage('Flagged for restock')
  closeProductSheet()
}

function submitIssue() {
  if (!issueFormValid.value) return
  issueForm.value = { type: '', location: '', notes: '' }
  showToastMessage('Issue reported — manager notified')
}

function showToastMessage(message: string) {
  toastText.value = message
  showToast.value = true
  setTimeout(() => {
    showToast.value = false
  }, 3000)
}

function submitHandoff() {
  if (!uncompletedTasks.value.length) return
  showHandoffModal.value = false
  showToastMessage('Handoff submitted. Have a good one, Jordan.')
}

function handleNav(view: typeof currentView.value) {
  currentView.value = view
}

onMounted(() => {
  const searchInput = document.getElementById('product-search') as HTMLInputElement | null
  if (searchInput) searchInput.focus()
})
</script>

<template>
  <div class="app-shell">
    <header class="top-bar" v-if="currentView !== 'report'">
      <div class="store-meta">
        <div class="store-name">Store #0447</div>
        <div class="associate-name">Jordan M.</div>
      </div>
      <div class="header-right">
        <span class="date-pill">{{ todayDate }}</span>
        <button class="end-shift-btn" @click="showHandoffModal = true">End Shift</button>
      </div>
    </header>

    <main class="screen" v-if="currentView === 'tasks'">
      <section class="section-block">
        <h2>Must Do Today</h2>
        <div class="task-list">
          <div
            v-for="task in mustDoTasks"
            :key="task.id"
            class="task-card"
            :class="{ expanded: expandedTaskIds.includes(task.id), complete: task.status === 'done' }"
            @click="toggleTask(task.id)"
          >
            <div class="task-main-row">
              <div class="task-status-dot" :style="{ background: statusColor(task.status) }"></div>
              <div class="task-copy">
                <div class="task-title-row">
                  <h3>{{ task.title }}</h3>
                  <span v-if="task.carriedOver" class="carried-over">Carried over</span>
                </div>
                <p>{{ task.location }}</p>
              </div>
            </div>

            <div class="task-badges">
              <span class="status-badge" :style="{ color: statusColor(task.status) }">
                {{ task.status === 'pending' ? 'Pending' : task.status === 'in-progress' ? 'In Progress' : 'Done' }}
              </span>
            </div>

            <div v-if="expandedTaskIds.includes(task.id)" class="task-details">
              <div class="meta-line" v-if="task.notes">{{ task.notes }}</div>
              <div class="meta-line" v-if="task.relatedSku">Related SKU: {{ task.relatedSku }}</div>
              <div class="action-row">
                <template v-if="task.status === 'pending'">
                  <button class="action-btn" @click.stop="markTaskStatus(task.id, 'in-progress')">Mark In Progress</button>
                  <button class="action-btn primary" @click.stop="markTaskStatus(task.id, 'done')">Mark Done</button>
                </template>
                <template v-else-if="task.status === 'in-progress'">
                  <button class="action-btn" @click.stop="revertTask(task.id)">Revert to Pending</button>
                  <button class="action-btn primary" @click.stop="markTaskStatus(task.id, 'done')">Mark Done</button>
                </template>
                <template v-else>
                  <button class="action-btn" @click.stop="revertTask(task.id)">Reopen</button>
                  <button class="action-btn primary" @click.stop="markTaskStatus(task.id, 'in-progress')">Mark In Progress</button>
                </template>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="section-block faded">
        <h2>As Time Allows</h2>
        <div class="task-list">
          <div
            v-for="task in asTimeAllowsTasks"
            :key="task.id"
            class="task-card secondary"
            :class="{ expanded: expandedTaskIds.includes(task.id), complete: task.status === 'done' }"
            @click="toggleTask(task.id)"
          >
            <div class="task-main-row">
              <div class="task-status-dot" :style="{ background: statusColor(task.status) }"></div>
              <div class="task-copy">
                <div class="task-title-row">
                  <h3>{{ task.title }}</h3>
                  <span v-if="task.carriedOver" class="carried-over">Carried over</span>
                </div>
                <p>{{ task.location }}</p>
              </div>
            </div>

            <div class="task-badges">
              <span class="status-badge" :style="{ color: statusColor(task.status) }">
                {{ task.status === 'pending' ? 'Pending' : task.status === 'in-progress' ? 'In Progress' : 'Done' }}
              </span>
            </div>

            <div v-if="expandedTaskIds.includes(task.id)" class="task-details">
              <div class="meta-line" v-if="task.notes">{{ task.notes }}</div>
              <div class="meta-line" v-if="task.relatedSku">Related SKU: {{ task.relatedSku }}</div>
              <div class="action-row">
                <template v-if="task.status === 'pending'">
                  <button class="action-btn" @click.stop="markTaskStatus(task.id, 'in-progress')">Mark In Progress</button>
                  <button class="action-btn primary" @click.stop="markTaskStatus(task.id, 'done')">Mark Done</button>
                </template>
                <template v-else-if="task.status === 'in-progress'">
                  <button class="action-btn" @click.stop="revertTask(task.id)">Revert to Pending</button>
                  <button class="action-btn primary" @click.stop="markTaskStatus(task.id, 'done')">Mark Done</button>
                </template>
                <template v-else>
                  <button class="action-btn" @click.stop="revertTask(task.id)">Reopen</button>
                  <button class="action-btn primary" @click.stop="markTaskStatus(task.id, 'in-progress')">Mark In Progress</button>
                </template>
              </div>
            </div>
          </div>
        </div>
      </section>

      <section class="section-block completed-section" v-if="completedTasks.length">
        <h2>Completed</h2>
        <div class="task-list compact-list">
          <div v-for="task in completedTasks" :key="task.id" class="task-card complete-item">
            <div class="task-main-row">
              <div class="task-status-dot" :style="{ background: statusColor(task.status) }"></div>
              <div class="task-copy">
                <h3>{{ task.title }}</h3>
                <p>{{ task.location }}</p>
              </div>
            </div>
            <div class="task-badges">
              <button class="action-btn small" @click.stop="revertTask(task.id)">Reopen</button>
            </div>
          </div>
        </div>
      </section>
    </main>

    <main class="screen" v-else-if="currentView === 'search'">
      <div class="search-header">
        <h2>Product Search</h2>
      </div>
      <input
        id="product-search"
        v-model="searchQuery"
        class="search-input"
        type="text"
        placeholder="Search by name or SKU"
        autocomplete="off"
      />

      <div class="product-list">
        <button
          v-for="product in filteredProducts"
          :key="product.id"
          class="product-item"
          @click="openProductSheet(product)"
        >
          <div class="product-name">{{ product.name }}</div>
          <div class="product-sku">{{ product.sku }}</div>
          <div class="product-row">
            <span>{{ product.aisle }} • {{ product.bay }}</span>
            <span class="status-badge" :style="{ color: statusColor(product.stockStatus) }">
              {{ product.stockStatus }}
            </span>
          </div>
        </button>
      </div>
    </main>

    <main class="screen" v-else-if="currentView === 'report'">
      <div class="report-header">
        <h2>Report Issue</h2>
      </div>

      <form class="issue-form" @submit.prevent="submitIssue">
        <label>
          <span>Issue Type</span>
          <select v-model="issueForm.type">
            <option value="">Select issue</option>
            <option value="Damaged Product">Damaged Product</option>
            <option value="Empty Shelf/Peg">Empty Shelf/Peg</option>
            <option value="Spill or Hazard">Spill or Hazard</option>
            <option value="Pricing Discrepancy">Pricing Discrepancy</option>
            <option value="Other">Other</option>
          </select>
        </label>

        <label>
          <span>Location</span>
          <input v-model="issueForm.location" type="text" placeholder="e.g. Aisle 7 Bay 2" />
        </label>

        <label>
          <span>Notes</span>
          <textarea v-model="issueForm.notes" maxlength="200" rows="4" placeholder="Add details"></textarea>
          <small>{{ noteCharCount }}/200</small>
        </label>

        <button class="primary-submit" type="submit" :disabled="!issueFormValid">Submit</button>
      </form>
    </main>

    <main class="screen" v-else>
      <div class="notes-header">
        <h2>Manager Notes</h2>
      </div>
      <div class="notes-list">
        <article v-for="note in managerNotes" :key="note.id" class="note-card">
          <div class="note-time">{{ note.timestamp }}</div>
          <p>{{ note.text }}</p>
        </article>
      </div>
    </main>

    <nav class="bottom-nav" aria-label="Main navigation">
      <button
        v-for="item in navItems"
        :key="item.id"
        class="nav-item"
        :class="{ active: currentView === item.id }"
        @click="handleNav(item.id)"
      >
        <span class="nav-icon">{{ item.icon }}</span>
        <span>{{ item.label }}</span>
      </button>
    </nav>

    <div v-if="showToast" class="toast">{{ toastText }}</div>

    <div v-if="showBottomSheet" class="sheet-backdrop" @click="closeProductSheet">
      <div class="bottom-sheet" @click.stop v-if="selectedProduct">
        <div class="sheet-grabber"></div>
        <div class="sheet-header">
          <h3>{{ selectedProduct.name }}</h3>
          <button class="close-sheet" @click="closeProductSheet">×</button>
        </div>
        <div class="sheet-meta">
          <div><strong>SKU:</strong> {{ selectedProduct.sku }}</div>
          <div><strong>Location:</strong> {{ selectedProduct.aisle }} • {{ selectedProduct.bay }}</div>
          <div><strong>Status:</strong> {{ selectedProduct.stockStatus }}</div>
          <div><strong>Last Restocked:</strong> {{ selectedProduct.lastRestocked }}</div>
        </div>
        <button class="primary-submit" @click="flagForRestock">Flag for Restock</button>
      </div>
    </div>

    <div v-if="showHandoffModal" class="handoff-overlay">
      <div class="handoff-modal">
        <div class="modal-header">
          <h3>Shift Handoff</h3>
          <button class="close-sheet" @click="showHandoffModal = false">×</button>
        </div>

        <div class="handoff-list">
          <div v-for="task in uncompletedTasks" :key="task.id" class="handoff-item">
            <span>{{ task.title }}</span>
            <input
              v-model="handoffNotes[task.id]"
              type="text"
              placeholder="Handoff note"
              aria-label="Handoff note for task"
            />
          </div>
        </div>

        <button class="primary-submit" :disabled="!uncompletedTasks.length" @click="submitHandoff">Submit Handoff</button>
      </div>
    </div>
  </div>
</template>

<style scoped>
:global(html, body, #app) {
  margin: 0;
  width: 100%;
  min-height: 100%;
  background: #f1f5f9;
  font-family: system-ui, -apple-system, BlinkMacSystemFont, 'Segoe UI', sans-serif;
  color: #0f172a;
}

* {
  box-sizing: border-box;
}

button,
input,
select,
textarea {
  font: inherit;
}

.app-shell {
  width: 100%;
  max-width: 390px;
  min-height: 100vh;
  margin: 0 auto;
  position: relative;
  background: #f1f5f9;
  padding-bottom: 88px;
}

.top-bar {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 16px 14px 12px;
  background: #f1f5f9;
  position: sticky;
  top: 0;
  z-index: 10;
}

.store-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.store-name {
  font-size: 14px;
  color: #64748b;
}

.associate-name {
  font-weight: 700;
  font-size: 18px;
}

.date-pill {
  font-size: 12px;
  color: #64748b;
  background: rgba(29, 78, 216, 0.06);
  border-radius: 999px;
  padding: 7px 10px;
  display: inline-block;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 8px;
}

.end-shift-btn {
  border: 1px solid #e2e8f0;
  background: #fff;
  color: #0f172a;
  border-radius: 12px;
  padding: 8px 10px;
  min-height: 40px;
  cursor: pointer;
}

.screen {
  padding: 0 14px;
}

.section-block {
  margin-bottom: 20px;
}

.section-block h2 {
  margin: 0 0 10px;
  font-size: 20px;
}

.task-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.task-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 14px;
  padding: 12px 12px 10px;
  cursor: pointer;
  transition: transform 0.2s ease;
  box-shadow: 0 1px 0 rgba(15, 23, 42, 0.02);
}

.task-card.secondary {
  opacity: 0.8;
}

.task-card.expanded {
  border-color: rgba(29, 78, 216, 0.25);
}

.task-card.complete,
.complete-item {
  opacity: 0.78;
}

.task-main-row {
  display: flex;
  align-items: flex-start;
  gap: 10px;
}

.task-status-dot {
  width: 12px;
  height: 12px;
  border-radius: 50%;
  margin-top: 6px;
  flex-shrink: 0;
}

.task-copy {
  flex: 1;
}

.task-title-row {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 8px;
}

.task-card h3 {
  font-size: 16px;
  margin: 0;
  line-height: 1.4;
}

.task-card p {
  margin: 4px 0 0;
  font-size: 14px;
  color: #64748b;
}

.task-badges {
  margin-top: 10px;
  display: flex;
  justify-content: flex-end;
}

.status-badge {
  display: inline-flex;
  align-items: center;
  font-size: 12px;
  font-weight: 700;
  letter-spacing: 0.02em;
}

.carried-over {
  font-size: 10px;
  color: #0f172a;
  background: #f8fafc;
  border: 1px solid #e2e8f0;
  padding: 4px 6px;
  border-radius: 999px;
}

.task-details {
  margin-top: 12px;
  border-top: 1px solid #e2e8f0;
  padding-top: 10px;
}

.meta-line {
  color: #0f172a;
  font-size: 14px;
  margin-bottom: 10px;
}

.action-row {
  display: flex;
  gap: 8px;
}

.action-btn,
.primary-submit,
.nav-item,
.close-sheet,
.end-shift-btn,
.product-item {
  transition: all 0.15s ease;
}

.action-btn {
  flex: 1;
  min-height: 48px;
  background: #fff;
  color: #0f172a;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  cursor: pointer;
}

.action-btn.small {
  flex: none;
  padding: 8px 12px;
  min-height: 36px;
  font-size: 12px;
}

.action-btn.primary,
.primary-submit {
  background: #1d4ed8;
  color: #fff;
  border: none;
  min-height: 48px;
  border-radius: 12px;
  cursor: pointer;
  font-weight: 700;
}

.primary-submit {
  width: 100%;
  margin-top: 16px;
}

.primary-submit:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.faded h2 {
  color: #475569;
}

.completed-section {
  padding-bottom: 8px;
}

.compact-list {
  gap: 8px;
}

.search-header,
.report-header,
.notes-header {
  padding-top: 10px;
  margin-bottom: 14px;
}

.search-header h2,
.report-header h2,
.notes-header h2 {
  margin: 0;
  font-size: 20px;
}

.search-input {
  width: 100%;
  min-height: 48px;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  padding: 12px 14px;
  background: #fff;
  color: #0f172a;
  margin-bottom: 12px;
}

.product-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.product-item {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px;
  text-align: left;
  cursor: pointer;
}

.product-name {
  font-weight: 700;
  margin-bottom: 6px;
}

.product-sku {
  color: #64748b;
  font-size: 14px;
  margin-bottom: 8px;
}

.product-row {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 8px;
  color: #475569;
  font-size: 14px;
}

.issue-form {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.issue-form label {
  display: flex;
  flex-direction: column;
  gap: 8px;
  color: #0f172a;
  font-weight: 600;
}

.issue-form input,
.issue-form select,
.issue-form textarea {
  width: 100%;
  border: 1px solid #cbd5e1;
  border-radius: 12px;
  padding: 12px 14px;
  background: #fff;
  color: #0f172a;
}

.issue-form textarea {
  resize: vertical;
  min-height: 96px;
}

.issue-form small {
  font-size: 12px;
  color: #64748b;
  text-align: right;
}

.notes-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.note-card {
  background: #fff;
  border: 1px solid #e2e8f0;
  border-radius: 12px;
  padding: 12px;
}

.note-time {
  font-size: 12px;
  color: #64748b;
  margin-bottom: 8px;
}

.note-card p {
  margin: 0;
  line-height: 1.5;
}

.bottom-nav {
  position: fixed;
  left: 50%;
  bottom: 0;
  transform: translateX(-50%);
  width: 100%;
  max-width: 390px;
  background: #fff;
  border-top: 1px solid #e2e8f0;
  display: grid;
  grid-template-columns: repeat(4, minmax(0, 1fr));
  padding: 8px 12px 12px;
  z-index: 30;
}

.nav-item {
  background: transparent;
  border: none;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: 4px;
  min-height: 48px;
  color: #64748b;
  font-size: 12px;
  cursor: pointer;
}

.nav-item.active {
  color: #1d4ed8;
}

.nav-icon {
  font-size: 18px;
  line-height: 1;
}

.toast {
  position: fixed;
  top: 16px;
  left: 50%;
  transform: translateX(-50%);
  background: rgba(15, 23, 42, 0.92);
  color: #fff;
  padding: 10px 14px;
  border-radius: 999px;
  font-size: 13px;
  z-index: 50;
  animation: fadeIn 0.15s ease-in;
}

@keyframes fadeIn {
  from { opacity: 0; }
  to { opacity: 1; }
}

.sheet-backdrop {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.25);
  z-index: 40;
  display: flex;
  align-items: flex-end;
  justify-content: center;
}

.bottom-sheet {
  width: 100%;
  max-width: 390px;
  background: #fff;
  border-radius: 20px 20px 0 0;
  padding: 8px 14px 20px;
  animation: slideUp 0.25s ease-out;
}

@keyframes slideUp {
  from { transform: translateY(100%); }
  to { transform: translateY(0); }
}

.sheet-grabber {
  width: 44px;
  height: 5px;
  border-radius: 999px;
  background: #cbd5e1;
  margin: 6px auto 14px;
}

.sheet-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 12px;
}

.sheet-header h3 {
  margin: 0;
  font-size: 20px;
}

.close-sheet {
  background: transparent;
  border: none;
  font-size: 26px;
  line-height: 1;
  cursor: pointer;
  color: #0f172a;
}

.sheet-meta {
  display: flex;
  flex-direction: column;
  gap: 10px;
  color: #0f172a;
  font-size: 14px;
  margin: 16px 0 18px;
}

.handoff-overlay {
  position: fixed;
  inset: 0;
  background: rgba(15, 23, 42, 0.35);
  z-index: 45;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20px;
}

.handoff-modal {
  width: 100%;
  max-width: 390px;
  background: #fff;
  border-radius: 18px;
  padding: 18px 14px 16px;
}

.modal-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 12px;
}

.modal-header h3 {
  margin: 0;
  font-size: 20px;
}

.handoff-list {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 12px;
}

.handoff-item {
  display: flex;
  flex-direction: column;
  gap: 8px;
  font-size: 14px;
}

.handoff-item input {
  min-height: 48px;
  border: 1px solid #cbd5e1;
  border-radius: 10px;
  padding: 10px 12px;
}

@media (min-width: 720px) {
  .app-shell {
    max-width: 430px;
  }
}
</style>
