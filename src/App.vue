<template>
  <div ref="pageRef" class="dna-lab-page" :class="{ 'is-page-fullscreen': isFullscreen }">
    <header class="top-bar glass-panel">
      <div class="brand-box">
        <div class="brand-icon">🧬</div>
        <div>
          <div class="title-row">
            <h1>DNA双螺旋结构模型</h1>
          </div>
        </div>
      </div>

      <div class="mode-actions">
        <div class="tech-mode-tabs" role="tablist" aria-label="DNA 学习模式切换">
          <button v-for="mode in modeOptions" :key="mode.value" type="button" class="tech-mode-btn"
            :class="{ active: currentMode === mode.value }" @click="setMode(mode.value)">
            <span class="mode-icon">{{ mode.icon }}</span>
            <span>{{ mode.label }}</span>
          </button>
        </div>
        <div class="header-quick-actions">
          <button type="button" class="header-action-btn" :class="{ active: isFullscreen }" @click="toggleFullscreen">
            {{ isFullscreen ? '退出全屏' : '全屏' }}
          </button>
          <button type="button" class="header-action-btn" :class="{ active: isLeftPanelCollapsed }"
            @click="toggleLeftPanel">
            {{ isLeftPanelCollapsed ? '展开左侧' : '收起左侧' }}
          </button>
          <button type="button" class="header-action-btn" :class="{ active: isRightPanelCollapsed }"
            @click="toggleRightPanel">
            {{ isRightPanelCollapsed ? '展开右侧' : '收起右侧' }}
          </button>

          <button type="button" class="header-action-btn" @click="captureScene">📸 场景截图</button>
          <button v-if="currentMode === 'view'" type="button" class="header-action-btn helix-toggle-btn"
            :class="{ active: structureViewMode === 'helix' }" @click="toggleStructureViewMode">
            {{ structureViewMode === 'helix' ? '切换平面' : '切换螺旋' }}
          </button>
          <button type="button" class="header-action-btn" :disabled="!canExportModel" @click="exportSceneObj">⬇️ 导出
            OBJ</button>
          <button type="button" class="header-action-btn" :disabled="!canExportModel" @click="exportSceneStlAscii">⬇️ 导出
            STL</button>
          <button type="button" class="header-action-btn" @click="resetCamera">重置视角</button>
          <button type="button" class="header-action-btn" :class="{ active: isAutoRotating }" @click="toggleAutoRotate">
            {{ isAutoRotating ? '停止旋转' : '自动旋转' }}
          </button>
        </div>
      </div>
    </header>

    <main class="main-layout" :class="layoutStateClass">
      <aside v-show="!isLeftPanelCollapsed" class="left-panel glass-panel">
        <div class="panel-title">
          <span class="panel-icon">🧪</span>
          <div>
            <h2>分子组件库</h2>
            <p>拖入中间画布，按住分子拖动；空白处旋转场景，双击两个分子建立连接</p>
          </div>
        </div>


        <div class="component-group-list">
          <section v-for="group in paletteGroups" :key="group.title" class="palette-section">
            <div class="palette-section-title">
              <span>{{ group.title }}</span>
              <em v-if="group.desc">{{ group.desc }}</em>
            </div>

            <div class="component-list">
              <div v-for="item in group.items" :key="item.type" class="component-card" :class="[`type-${item.type}`]"
                draggable="true" @dragstart="onPaletteDragStart($event, item.type)"
                @click="addMoleculeFromPalette(item.type)">
                <div class="preview-wrap">
                  <div class="preview-glow" :style="{ background: item.previewGlow }"></div>
                  <div class="molecule-preview" :class="item.previewClass">
                    <template v-if="item.type === 'phosphate'">
                      <span>P</span>
                    </template>
                    <template v-else-if="item.type === 'sugar' || item.type === 'sugar_reverse'">
                      <svg viewBox="-10 0 92 80" aria-hidden="true">
                        <g :class="{ 'sugar-preview-reverse': item.type === 'sugar_reverse' }">
                          <!-- v31：五碳糖用教材化顶点编号。红色 O 在顶点处，1/2/3/4 沿顺时针方向标注，编号加大便于课堂投屏。 -->
                          <path class="sugar-bond sugar-bond-left" d="M7 31 L18 22 L30 28" />
                          <path class="sugar-bond sugar-bond-right" d="M73 31 L62 40 L50 32" />
                          <!-- v98：组件库预览补 4→5 折线。正向倒 V 左侧边更短；反向旋转后右侧边更短。 -->
                          <path class="sugar-bond sugar-bond-five" d="M8 30 L1 17 L-3 27" />
                          <polygon points="40,7 72,30 60,68 20,68 8,30" />
                          <circle class="sugar-oxygen-dot" cx="40" cy="8" r="7.2" />
                          <text class="sugar-oxygen-text" x="40" y="11.2" text-anchor="middle">O</text>
                          <text class="sugar-carbon-label" x="68" y="34" text-anchor="middle">1</text>
                          <text class="sugar-carbon-label" x="57" y="63" text-anchor="middle">2</text>
                          <text class="sugar-carbon-label" x="23" y="63" text-anchor="middle">3</text>
                          <text class="sugar-carbon-label" x="12" y="34" text-anchor="middle">4</text>
                          <text class="sugar-carbon-label sugar-carbon-label-five" x="0" y="14"
                            text-anchor="middle">5</text>
                        </g>
                      </svg>
                    </template>
                    <template v-else>
                      <div class="ring-preview" :class="item.ringClass">
                        <span>{{ item.type }}</span>
                      </div>
                    </template>
                  </div>
                </div>
                <div class="component-text">
                  <div class="component-name">{{ item.name }}</div>
                </div>
              </div>
            </div>
          </section>
        </div>
      </aside>

      <section class="center-panel glass-panel">
        <div ref="canvasWrapRef" class="canvas-wrap" @dragover.prevent @drop="onCanvasDrop"></div>

      </section>

      <aside v-show="!isRightPanelCollapsed" class="right-panel glass-panel">
        <div class="panel-title">
          <span class="panel-icon">📚</span>
          <div>
            <h2>知识点</h2>
          </div>
        </div>

        <div class="science-fix-cards">
          <div class="science-fix-card fix-blue">
            <h3>反向平行</h3>
            <p>脱氧核糖1'-C连碱基，5'-C连磷酸基团；单链游离磷酸基团端为5'端，游离羟基端为3'端；DNA双链反向平行，两条链5'→3'走向相反。</p>
          </div>
          <div class="science-fix-card fix-purple">
            <h3>嘌呤与嘧啶</h3>
            <p>A和G是双环嘌呤，T和C是单环嘧啶。配对后碱基对（A-T、G-C）宽度一致，保证DNA双螺旋直径恒定。</p>
          </div>
          <div class="science-fix-card fix-green">
            <h3>配对原则</h3>
            <div class="pair-rule-card compact">
              <div class="pair-line">
                <span class="base-chip a">A 腺嘌呤</span>
                <span class="bond-dot">··</span>
                <span class="base-chip t">T 胸腺嘧啶</span>
                <em>2 个氢键</em>
              </div>
              <div class="pair-line">
                <span class="base-chip g">G 鸟嘌呤</span>
                <span class="bond-dot">···</span>
                <span class="base-chip c">C 胞嘧啶</span>
                <em>3 个氢键</em>
              </div>
            </div>
          </div>
          <div class="science-fix-card fix-orange">
            <h3>磷酸二酯键</h3>
            <p>连接相邻两个脱氧核苷酸之间的化学键。</p>
          </div>
        </div>


        <el-card class="ops-card" shadow="never">
          <template #header>
            <div class="card-header">
              <span>课堂操作</span>
            </div>
          </template>
          <div class="ops-list">
            <el-button type="primary" @click="loadPresetDnaStructure">✨ 生成完整 DNA 结构</el-button>
            <el-button @click="clearSceneWithConfirm" type="danger">🗑️ 清空画布</el-button>
          </div>
        </el-card>
      </aside>
    </main>

    <el-dialog v-model="quizDialogVisible" class="dna-quiz-dialog" width="min(860px, 94vw)" top="6vh"
      :close-on-click-modal="false" :append-to-body="false" :teleported="false" modal-class="dna-quiz-overlay"
      @open="ensureQuizStarted">
      <template #header>
        <div class="quiz-dialog-head">
          <div class="quiz-dialog-title">
            <span>📝</span>
            <strong>DNA结构测验</strong>
          </div>
          <div class="quiz-score" v-if="quizSubmitted">得分: {{ quizScore }} / {{ quizQuestions.length }}</div>
        </div>
      </template>

      <div class="quiz-dialog-body">
        <section v-for="(question, qIndex) in quizQuestions" :key="question.id" class="quiz-question-card">
          <h3>{{ qIndex + 1 }}. {{ question.title }}</h3>
          <el-radio-group v-model="quizAnswers[question.id]" class="quiz-option-group" :disabled="quizSubmitted">
            <el-radio v-for="option in question.options" :key="option.value" :label="option.value" class="quiz-option"
              :class="getQuizOptionClass(question, option.value)">
              {{ option.label }}
            </el-radio>
          </el-radio-group>

          <div v-if="quizSubmitted" class="quiz-explain"
            :class="quizAnswers[question.id] === question.answer ? 'correct' : 'wrong'">
            {{ quizAnswers[question.id] === question.answer ? '回答正确：' : '回答错误：' }}{{ question.explain }}
          </div>
        </section>
      </div>

      <template #footer>
        <div class="quiz-dialog-footer">
          <el-button @click="quizDialogVisible = false">关闭</el-button>
          <el-button v-if="quizSubmitted" type="primary" @click="restartQuiz">重新测验</el-button>
          <el-button v-else type="primary" :disabled="!isQuizComplete" @click="submitQuiz">
            提交测验
          </el-button>
        </div>
      </template>
    </el-dialog>


  </div>
</template>

<script setup lang="ts">
import { computed, nextTick, onBeforeUnmount, onMounted, reactive, ref, shallowRef } from 'vue'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { EffectComposer } from 'three/examples/jsm/postprocessing/EffectComposer.js'
import { RenderPass } from 'three/examples/jsm/postprocessing/RenderPass.js'
import { UnrealBloomPass } from 'three/examples/jsm/postprocessing/UnrealBloomPass.js'
import { GLTFExporter } from 'three/examples/jsm/exporters/GLTFExporter.js'
import { OBJExporter } from 'three/examples/jsm/exporters/OBJExporter.js'
import { STLExporter } from 'three/examples/jsm/exporters/STLExporter.js'
import { ElMessage, ElMessageBox } from 'element-plus'

type Mode = 'build' | 'view' | 'quiz'
type StructureViewMode = 'plane' | 'helix'
type MoleculeType = 'sugar' | 'sugar_reverse' | 'phosphate' | 'A' | 'T' | 'G' | 'C'
type MoleculeKind = 'sugar' | 'phosphate' | 'base'
type BondType = 'ester' | 'glycosidic' | 'hydrogen'
type SugarBackbonePort = '3' | '5'
type KnowledgeType = 'success' | 'warning' | 'info' | 'primary' | 'danger'

interface ModeOption {
  value: Mode
  label: string
  icon: string
}

interface PaletteItem {
  type: MoleculeType
  name: string
  shortName: string
  description: string
  tips: string
  color: number
  cssColor: string
  previewGlow: string
  previewClass: string
  ringClass?: string
}

interface PaletteGroup {
  title: string
  desc?: string
  items: PaletteItem[]
}

interface MoleculeData {
  isMolecule: true
  id: string
  type: MoleculeType
  kind: MoleculeKind
  name: string
  shortName: string
  base?: 'A' | 'T' | 'G' | 'C'
  color: number
  cssColor: string
  connections: string[]
}

interface BondRule {
  valid: boolean
  bondType: BondType
  name: string
  count?: number
  pair?: boolean
}

interface BondData {
  id: string
  a: THREE.Group
  b: THREE.Group
  group: THREE.Group
  bondType: BondType
  name: string
  count: number
  sugarPort?: SugarBackbonePort
  /** v48：固定 4'→5'→P 折线方向，避免移动分子时折线从上折跳到下折 */
  foldSign?: number
}

interface FullStructureLayoutEntry {
  object: THREE.Group
  plane: THREE.Vector3
  helix: THREE.Vector3
  planeRotationZ: number
  helixRotationZ: number
}

interface SelectedInfo {
  id: string
  name: string
  detail: string
}

interface KnowledgeInfo {
  title: string
  tag: string
  type: KnowledgeType
  content: string
  points: string[]
}

interface QuizTask {
  title: string
  description: string
  checkType: 'nucleotide' | 'atPair' | 'gcPair' | 'anyPair'
  success: string
  fail: string
}

interface QuizOption {
  value: string
  label: string
}

interface QuizQuestion {
  id: string
  title: string
  options: QuizOption[]
  answer: string
  explain: string
}

const pageRef = ref<HTMLDivElement | null>(null)
const canvasWrapRef = ref<HTMLDivElement | null>(null)
const currentMode = ref<Mode>('build')
const structureViewMode = ref<StructureViewMode>('plane')
const isStructureAnimating = ref(false)
const isAutoRotating = ref(false)
const isLeftPanelCollapsed = ref(false)
const isRightPanelCollapsed = ref(false)
const isFullscreen = ref(false)
const hintText = ref('拖入分子到画布；空白处可旋转场景，按住分子拖动，双击两个分子建立连接，双击连接线删除连接。')
const selectedInfo = ref<SelectedInfo | null>(null)
const selectedGroup = shallowRef<THREE.Group | null>(null)
const connectionStartGroup = shallowRef<THREE.Group | null>(null)
const quizIndex = ref(0)
const quizResult = ref<{ correct: boolean; message: string } | null>(null)
const quizDialogVisible = ref(false)
const quizSubmitted = ref(false)
const quizAnswers = reactive<Record<string, string>>({})

const modeOptions: ModeOption[] = [
  { value: 'build', label: '构建模式', icon: '🔧' },
  { value: 'view', label: '观察模式', icon: '🔍' },
  /*   { value: 'quiz', label: '练习模式', icon: '📝' }, */
]

const sceneRef = shallowRef<THREE.Scene | null>(null)
const cameraRef = shallowRef<THREE.PerspectiveCamera | null>(null)
const rendererRef = shallowRef<THREE.WebGLRenderer | null>(null)
const composerRef = shallowRef<EffectComposer | null>(null)
const controlsRef = shallowRef<OrbitControls | null>(null)
const rootGroupRef = shallowRef<THREE.Group | null>(null)
const terminalStubGroupRef = shallowRef<THREE.Group | null>(null)

let animationId = 0
let canvasResizeObserver: ResizeObserver | null = null
let raycaster = new THREE.Raycaster()
let mouse = new THREE.Vector2()
let dragPlane: THREE.Mesh | null = null
let moleculeSeq = 0
let bondSeq = 0
let molecules: THREE.Group[] = []
let bonds: BondData[] = []
let draggedPaletteType: MoleculeType | null = null
let isDragging = false
let dragObject: THREE.Group | null = null
let dragMoved = false
let dragOffset = new THREE.Vector3()
let activePointerId: number | null = null
let fullStructureLayoutEntries: FullStructureLayoutEntry[] = []
let fullStructureAnimationFrame = 0
let cameraTransitionFrame = 0

const MOLECULE_SCALE = 0.78
const MOLECULE_SELECTED_SCALE = 0.84
const MOLECULE_DRAG_SCALE = 0.9

const stats = reactive({
  moleculeCount: 0,
  baseCount: 0,
  covalentCount: 0,
  hydrogenBondCount: 0,
  validPairCount: 0,
  buildProgress: 0,
  pairProgress: 0,
})

const moleculePalette: PaletteItem[] = [
  {
    type: 'phosphate',
    name: '磷酸',
    shortName: 'P',
    description: 'PO₄³⁻，连接脱氧核糖形成骨架',
    tips: '可连接：脱氧核糖',
    color: 0xf5b642,
    cssColor: '#f5b642',
    previewGlow: 'radial-gradient(circle, rgba(245,182,66,.55), rgba(245,182,66,0))',
    previewClass: 'preview-phosphate',
  },
  {
    type: 'sugar',
    name: '脱氧核糖',
    shortName: '糖',
    description: 'DNA 中的五碳糖，具有 5’ / 3’ 方向性',
    tips: '可连接：磷酸、碱基',
    color: 0x34d4ff,
    cssColor: '#34d4ff',
    previewGlow: 'radial-gradient(circle, rgba(52,212,255,.5), rgba(52,212,255,0))',
    previewClass: 'preview-sugar',
  },
  {
    type: 'sugar_reverse',
    name: '脱氧核糖（反向）',
    shortName: '反糖',
    description: '构建反向平行链，方向为 3’→5’',
    tips: '可连接：磷酸、碱基',
    color: 0x6ebdff,
    cssColor: '#6ebdff',
    previewGlow: 'radial-gradient(circle, rgba(110,189,255,.5), rgba(110,189,255,0))',
    previewClass: 'preview-sugar preview-sugar-reverse',
  },
  {
    type: 'A',
    name: '腺嘌呤 A',
    shortName: 'A',
    description: '嘌呤，双环结构，与 T 配对',
    tips: '可配对：T，形成 2 个氢键',
    color: 0xff4f9a,
    cssColor: '#ff4f9a',
    previewGlow: 'radial-gradient(circle, rgba(255,79,154,.55), rgba(255,79,154,0))',
    previewClass: 'preview-base preview-a',
    ringClass: 'double-ring',
  },
  {
    type: 'T',
    name: '胸腺嘧啶 T',
    shortName: 'T',
    description: '嘧啶，单环结构，与 A 配对',
    tips: '可配对：A，形成 2 个氢键',
    color: 0x9b5cff,
    cssColor: '#9b5cff',
    previewGlow: 'radial-gradient(circle, rgba(155,92,255,.55), rgba(155,92,255,0))',
    previewClass: 'preview-base preview-t',
    ringClass: 'single-ring',
  },
  {
    type: 'G',
    name: '鸟嘌呤 G',
    shortName: 'G',
    description: '嘌呤，双环结构，与 C 配对',
    tips: '可配对：C，形成 3 个氢键',
    color: 0xff8a3d,
    cssColor: '#ff8a3d',
    previewGlow: 'radial-gradient(circle, rgba(255,138,61,.58), rgba(255,138,61,0))',
    previewClass: 'preview-base preview-g',
    ringClass: 'double-ring',
  },
  {
    type: 'C',
    name: '胞嘧啶 C',
    shortName: 'C',
    description: '嘧啶，单环结构，与 G 配对',
    tips: '可配对：G，形成 3 个氢键',
    color: 0x20d789,
    cssColor: '#20d789',
    previewGlow: 'radial-gradient(circle, rgba(32,215,137,.58), rgba(32,215,137,0))',
    previewClass: 'preview-base preview-c',
    ringClass: 'single-ring',
  },
]

const paletteGroups = computed<PaletteGroup[]>(() => [
  {
    title: '五碳糖方向',
    desc: '正向 / 反向用于体现 DNA 双链反向平行',
    items: moleculePalette.filter((item) => item.type === 'sugar' || item.type === 'sugar_reverse'),
  },
  {
    title: '骨架组件',
    items: moleculePalette.filter((item) => item.type === 'phosphate'),
  },
  {
    title: '含氮碱基',
    desc: '注意嘌呤双环、嘧啶单环的尺寸区别',
    items: moleculePalette.filter((item) => ['A', 'T', 'G', 'C'].includes(item.type)),
  },
])

const pairRules: Record<string, BondRule> = {
  'A-T': { valid: true, bondType: 'hydrogen', name: 'A-T 氢键', count: 2, pair: true },
  'T-A': { valid: true, bondType: 'hydrogen', name: 'T-A 氢键', count: 2, pair: true },
  'G-C': { valid: true, bondType: 'hydrogen', name: 'G-C 氢键', count: 3, pair: true },
  'C-G': { valid: true, bondType: 'hydrogen', name: 'C-G 氢键', count: 3, pair: true },
}

const connectionRules: Record<string, BondRule> = {
  'sugar-phosphate': { valid: true, bondType: 'ester', name: '磷酸酯键', count: 1 },
  'phosphate-sugar': { valid: true, bondType: 'ester', name: '磷酸酯键', count: 1 },
  'sugar-A': { valid: true, bondType: 'glycosidic', name: '糖苷键', count: 1 },
  'A-sugar': { valid: true, bondType: 'glycosidic', name: '糖苷键', count: 1 },
  'sugar-T': { valid: true, bondType: 'glycosidic', name: '糖苷键', count: 1 },
  'T-sugar': { valid: true, bondType: 'glycosidic', name: '糖苷键', count: 1 },
  'sugar-G': { valid: true, bondType: 'glycosidic', name: '糖苷键', count: 1 },
  'G-sugar': { valid: true, bondType: 'glycosidic', name: '糖苷键', count: 1 },
  'sugar-C': { valid: true, bondType: 'glycosidic', name: '糖苷键', count: 1 },
  'C-sugar': { valid: true, bondType: 'glycosidic', name: '糖苷键', count: 1 },
  ...pairRules,
}

const quizTasks: QuizTask[] = [
  {
    title: '任务一：构建一个脱氧核苷酸',
    description: '请在画布中形成“磷酸 + 脱氧核糖 + 任意一个碱基”的连接关系。',
    checkType: 'nucleotide',
    success: '正确：脱氧核苷酸由一分子磷酸、一分子脱氧核糖和一分子含氮碱基组成。',
    fail: '还没完成：需要至少一个磷酸、一个脱氧核糖、一个碱基，并让糖分别连接磷酸和碱基。',
  },
  {
    title: '任务二：完成 A-T 互补配对',
    description: '请添加 A 与 T，先双击 A，再双击 T，建立 2 条氢键。',
    checkType: 'atPair',
    success: '正确：A 腺嘌呤与 T 胸腺嘧啶互补配对，形成 2 个氢键。',
    fail: '还没完成：请添加 A 和 T，并通过双击两个分子建立配对连接。',
  },
  {
    title: '任务三：完成 G-C 互补配对',
    description: '请添加 G 与 C，先双击 G，再双击 C，建立 3 条氢键。',
    checkType: 'gcPair',
    success: '正确：G 鸟嘌呤与 C 胞嘧啶互补配对，形成 3 个氢键。',
    fail: '还没完成：请添加 G 和 C，并通过双击两个分子建立配对连接。',
  },
]

const quizQuestions: QuizQuestion[] = [
  {
    id: 'q1',
    title: `在双链 DNA 分子中，连接同一条链上相邻两个脱氧核苷酸的化学键是：`,
    options: [
      { value: 'A', label: `A. 氢键` },
      { value: 'B', label: `B. 磷酸酯键` },
      { value: 'C', label: `C. 磷酸二酯键` },
      { value: 'D', label: `D. 糖苷键` },
    ],
    answer: 'C',
    explain: `磷酸二酯键连接的是同一条单链上相邻脱氧核苷酸的 3' 碳和 5' 碳上的磷酸。氢键连接碱基对，糖苷键连接糖和碱基，磷酸酯键是单个核苷酸内部糖和磷酸的连接。`,
  },
  {
    id: 'q2',
    title: `关于 DNA 的“反向平行”结构，下列说法正确的是：`,
    options: [
      { value: 'A', label: `A. 两条链的碱基序列完全相同，但方向相反` },
      { value: 'B', label: `B. 一条链是 5'→3' 走向，另一条链是 3'→5' 走向` },
      { value: 'C', label: `C. 反向平行是指嘌呤和嘧啶的排列方向相反` },
      { value: 'D', label: `D. 两条链互为镜像对称` },
    ],
    answer: 'B',
    explain: `反向平行是指 DNA 双螺旋两条链的骨架方向相反，一条从 5' 端到 3' 端，另一条从 3' 端到 5' 端。`,
  },
  {
    id: 'q3',
    title: `依据 DNA 双螺旋结构的碱基互补配对原则，下列关于双链 DNA 分子中碱基数量关系的表达式，必然正确的是：`,
    options: [
      { value: 'A', label: `A. A + T = G + C` },
      { value: 'B', label: `B. A = G, T = C` },
      { value: 'C', label: `C. (A + G) / (T + C) = 1` },
      { value: 'D', label: `D. (A + T) / (G + C) = 1` },
    ],
    answer: 'C',
    explain: `在双链 DNA 中，由于腺嘌呤 A 一定与胸腺嘧啶 T 配对，鸟嘌呤 G 一定与胞嘧啶 C 配对，因此嘌呤 A+G 总数等于嘧啶 T+C 总数，其比值为 1。`,
  },
  {
    id: 'q5',
    title: `构成 DNA 分子双螺旋基本骨架的化学成分是：`,
    options: [
      { value: 'A', label: `A. 交替排列的核糖和磷酸` },
      { value: 'B', label: `B. 交替排列的脱氧核糖和磷酸` },
      { value: 'C', label: `C. 通过氢键相连的碱基对` },
      { value: 'D', label: `D. 交替排列的脱氧核糖和含氮碱基` },
    ],
    answer: 'B',
    explain: `DNA 双螺旋的外侧是由交替连接的脱氧核糖和磷酸基团构成的基本骨架；内侧则是含氮碱基通过氢键连接形成的碱基对。`,
  },
]

const quizScore = computed(() => quizQuestions.reduce((score, question) => score + (quizAnswers[question.id] === question.answer ? 1 : 0), 0))
const isQuizComplete = computed(() => quizQuestions.every((question) => Boolean(quizAnswers[question.id])))

const currentQuiz = computed(() => quizTasks[quizIndex.value])

const layoutStateClass = computed(() => ({
  'left-collapsed': isLeftPanelCollapsed.value,
  'right-collapsed': isRightPanelCollapsed.value,
}))

const canExportModel = computed(() => currentMode.value === 'view' && structureViewMode.value === 'helix')

const modeHintTitle = computed(() => {
  if (currentMode.value === 'build') return '构建模式'
  if (currentMode.value === 'view') return '观察模式'
  return '练习模式'
})

const modeHintText = computed(() => {
  if (currentMode.value === 'build') return '鼠标可旋转/缩放场景；按住分子拖动时场景不会转动；双击两个分子建立连接。'
  if (currentMode.value === 'view') return '可旋转、缩放观察完整 DNA 结构。'
  return '完成弹窗中的 DNA 结构测验，提交前需要答完所有题目。'
})

const knowledge = computed<KnowledgeInfo>(() => {
  const selected = selectedGroup.value
  if (!selected) {
    return {
      title: 'DNA 结构核心规则',
      tag: '总览',
      type: 'primary',
      content: 'DNA 分子由两条反向平行的脱氧核苷酸链组成，外侧是磷酸—脱氧核糖骨架，内侧是碱基互补配对。',
      points: [
        'A 与 T 配对，形成 2 个氢键。',
        'G 与 C 配对，形成 3 个氢键。',
        'A / G 为嘌呤双环，T / C 为嘧啶单环。',
      ],
    }
  }

  const data = selected.userData as MoleculeData
  if (data.type === 'phosphate') {
    return {
      title: '磷酸基团',
      tag: '骨架',
      type: 'warning',
      content: '磷酸基团与脱氧核糖交替连接，构成 DNA 链外侧稳定的磷酸—脱氧核糖骨架。',
      points: ['与糖连接形成磷酸酯键。', '相邻核苷酸之间通过磷酸二酯键连接。', '在教学模型中用黄色发光球表示。'],
    }
  }

  if (data.kind === 'sugar') {
    return {
      title: '脱氧核糖',
      tag: '五碳糖',
      type: 'success',
      content: '脱氧核糖是 DNA 中的五碳糖，连接磷酸和含氮碱基，是脱氧核苷酸的重要组成部分。',
      points: ['连接磷酸形成骨架。', '连接 A/T/G/C 碱基形成糖苷键。'],
    }
  }

  const baseText: Record<string, KnowledgeInfo> = {
    A: {
      title: '腺嘌呤 A',
      tag: '嘌呤',
      type: 'danger',
      content: 'A 是嘌呤类碱基，具有双环结构，在 DNA 中只与 T 互补配对。',
      points: ['A-T 之间形成 2 个氢键。', 'A 是大分子嘌呤，T 是小分子嘧啶。', '大配小使 DNA 双链宽度保持稳定。'],
    },
    T: {
      title: '胸腺嘧啶 T',
      tag: '嘧啶',
      type: 'info',
      content: 'T 是嘧啶类碱基，具有单环结构，在 DNA 中只与 A 互补配对。',
      points: ['T 只与 A 配对。', 'A-T 之间形成 2 个氢键。', 'RNA 中通常用 U 替代 T。'],
    },
    G: {
      title: '鸟嘌呤 G',
      tag: '嘌呤',
      type: 'warning',
      content: 'G 是嘌呤类碱基，具有双环结构，在 DNA 中只与 C 互补配对。',
      points: ['G-C 之间形成 3 个氢键。', 'G-C 比 A-T 更稳定。', 'GC 含量越高，DNA 双链通常越稳定。'],
    },
    C: {
      title: '胞嘧啶 C',
      tag: '嘧啶',
      type: 'success',
      content: 'C 是嘧啶类碱基，具有单环结构，在 DNA 中只与 G 互补配对。',
      points: ['C 只与 G 配对。', 'G-C 之间形成 3 个氢键。', 'C 与 G 的互补关系是 DNA 稳定性的重要来源。'],
    },
  }

  return baseText[data.base || data.type]
})

onMounted(async () => {
  await nextTick()
  initThreeScene()
  setMode('build')
})

onBeforeUnmount(() => {
  destroyThreeScene()
})

function setMode(mode: Mode) {
  currentMode.value = mode
  handleModeChange(mode)
}

function handleModeChange(mode: Mode | string | number | boolean | undefined) {
  const nextMode = mode as Mode
  quizResult.value = null
  const controls = controlsRef.value
  if (controls) {
    // 平面构建 + 3D 观察：允许鼠标旋转/缩放场景；拖动分子时会临时禁用，避免和分子拖拽冲突。
    controls.enabled = true
    controls.enableRotate = true
    controls.enablePan = true
    controls.enableZoom = true
    controls.autoRotate = isAutoRotating.value
  }

  if (nextMode === 'build') {
    setOrbitAutoRotate(false, { silent: true })
    if (structureViewMode.value === 'helix') animateFullStructureToMode('plane', { silent: true })
    structureViewMode.value = 'plane'
    hintText.value = '构建模式：构建与答题均保持平面搭建；按住分子拖动位置，双击两个分子建立连接。'
  }

  if (nextMode === 'view') {
    hintText.value = structureViewMode.value === 'helix'
      ? '观察模式：当前为螺旋模式，可导出 OBJ / STL 模型。'
      : '观察模式：当前为平面模式，点击“切换螺旋”后可导出模型。'
    if (molecules.length === 0) {
      loadPresetDnaStructure()
    } else if (structureViewMode.value === 'plane' && isCustomStructureReadyForHelix()) {
      // v54：进入观察模式时先把自建结构规整成教材式平面梯形结构，
      // 不再直接沿用用户随手摆放的位置，否则平面和后续螺旋都会显得不像 DNA。
      fullStructureLayoutEntries = []
      if (createCustomHelixLayoutFromCurrentScene()) animateFullStructureToMode('plane', { silent: true })
    }
  }

  if (nextMode === 'quiz') {
    setOrbitAutoRotate(false, { silent: true })
    if (structureViewMode.value === 'helix') animateFullStructureToMode('plane', { silent: true })
    structureViewMode.value = 'plane'
    hintText.value = '练习模式：完成弹窗中的 DNA 结构测验，提交前需要答完所有题目。'
    openQuizDialog()
  }
}

function createSceneBackgroundTexture() {
  const canvas = document.createElement('canvas')
  canvas.width = 1024
  canvas.height = 1024
  const ctx = canvas.getContext('2d')!

  // v98：按源代码原来的蓝色科技风改，只去掉暗色渐变并提亮蓝色；不再使用接近白色的背景。
  const base = ctx.createLinearGradient(0, 0, 1024, 1024)
  base.addColorStop(0, '#6fbce3')
  base.addColorStop(0.45, '#56a9d8')
  base.addColorStop(1, '#3f8fc5')
  ctx.fillStyle = base
  ctx.fillRect(0, 0, 1024, 1024)

  const cyanGlow = ctx.createRadialGradient(220, 210, 0, 220, 210, 520)
  cyanGlow.addColorStop(0, 'rgba(88, 224, 255, 0.22)')
  cyanGlow.addColorStop(0.55, 'rgba(88, 224, 255, 0.1)')
  cyanGlow.addColorStop(1, 'rgba(88, 224, 255, 0)')
  ctx.fillStyle = cyanGlow
  ctx.fillRect(0, 0, 1024, 1024)

  const purpleGlow = ctx.createRadialGradient(820, 150, 0, 820, 150, 480)
  purpleGlow.addColorStop(0, 'rgba(155, 92, 255, 0.1)')
  purpleGlow.addColorStop(0.62, 'rgba(155, 92, 255, 0.045)')
  purpleGlow.addColorStop(1, 'rgba(155, 92, 255, 0)')
  ctx.fillStyle = purpleGlow
  ctx.fillRect(0, 0, 1024, 1024)

  const softVignette = ctx.createRadialGradient(512, 460, 120, 512, 460, 760)
  softVignette.addColorStop(0, 'rgba(255,255,255,0.02)')
  softVignette.addColorStop(0.72, 'rgba(20,90,135,0.015)')
  softVignette.addColorStop(1, 'rgba(30,90,135,0.08)')
  ctx.fillStyle = softVignette
  ctx.fillRect(0, 0, 1024, 1024)

  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.needsUpdate = true
  return texture
}

function initThreeScene() {
  const container = canvasWrapRef.value
  if (!container) return

  const scene = new THREE.Scene()
  // v7：EffectComposer 开启 Bloom 后，透明背景会被渲染成纯黑；这里恢复主场景的深蓝科技渐变背景。
  scene.background = createSceneBackgroundTexture()
  scene.fog = new THREE.Fog(0x55a6d2, 62, 146)
  sceneRef.value = scene

  const camera = new THREE.PerspectiveCamera(42, container.clientWidth / container.clientHeight, 0.1, 1000)
  camera.position.set(0, 0, 42)
  cameraRef.value = camera

  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: false, preserveDrawingBuffer: true })
  renderer.setSize(container.clientWidth, container.clientHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.toneMapping = THREE.ACESFilmicToneMapping
  renderer.toneMappingExposure = 1.03
  renderer.shadowMap.enabled = true
  renderer.shadowMap.type = THREE.PCFSoftShadowMap
  renderer.domElement.className = 'dna-three-canvas'
  container.appendChild(renderer.domElement)
  rendererRef.value = renderer

  const composer = new EffectComposer(renderer)
  composer.setSize(container.clientWidth, container.clientHeight)
  composer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  composer.addPass(new RenderPass(scene, camera))
  // 真正的 Mesh 外发光：依赖材质 emissive + 后期 Bloom，从模型亮部向外扩散，不再使用贴在后面的发光团。
  // v8：降低 Bloom 强度并提高阈值，避免分子文字和连接线被强光吞掉。
  const bloomPass = new UnrealBloomPass(
    new THREE.Vector2(container.clientWidth, container.clientHeight),
    0.22,
    0.22,
    0.78,
  )
  composer.addPass(bloomPass)
  composerRef.value = composer

  const controls = new OrbitControls(camera, renderer.domElement)
  controls.enableDamping = true
  controls.dampingFactor = 0.1
  // 允许鼠标旋转 / 缩放 / 平移场景；真正拖动分子时临时禁用 controls，避免互相抢事件。
  controls.enableRotate = true
  controls.enablePan = true
  controls.enableZoom = true
  controls.rotateSpeed = 0.42
  controls.zoomSpeed = 0.58
  controls.panSpeed = 0.38
  // v56：自动旋转交给 OrbitControls 处理，只转相机，不再旋转 DNA 根节点。
  // 这样模型自身坐标不变，平面 / 螺旋切换、连接线重建都不会再被 rootGroup.rotation 污染。
  controls.autoRotate = false
  controls.autoRotateSpeed = 1.25
  controls.minDistance = 12
  controls.maxDistance = 78
  controlsRef.value = controls

  const root = new THREE.Group()
  root.name = 'DNA_MOLECULE_ROOT'
  scene.add(root)
  rootGroupRef.value = root

  const terminalStubs = new THREE.Group()
  terminalStubs.name = 'DNA_TERMINAL_PHOSPHATE_STUBS'
  root.add(terminalStubs)
  terminalStubGroupRef.value = terminalStubs

  setupLights(scene)
  setupDragPlane(scene)

  renderer.domElement.addEventListener('pointerdown', onPointerDown)
  renderer.domElement.addEventListener('pointermove', onPointerMove)
  renderer.domElement.addEventListener('pointerup', onPointerUp)
  renderer.domElement.addEventListener('pointercancel', onPointerUp)
  renderer.domElement.addEventListener('dblclick', onDoubleClickSelect)
  window.addEventListener('resize', onWindowResize)
  document.addEventListener('fullscreenchange', handleFullscreenChange)

  canvasResizeObserver = new ResizeObserver(() => onWindowResize())
  canvasResizeObserver.observe(container)

  animate()
}

function setupLights(scene: THREE.Scene) {
  const ambient = new THREE.AmbientLight(0xbcd7ff, 0.55)
  scene.add(ambient)

  const key = new THREE.DirectionalLight(0xffffff, 1.15)
  key.position.set(12, 18, 28)
  key.castShadow = true
  scene.add(key)

  const blue = new THREE.PointLight(0x2ec4ff, 1.5, 90)
  blue.position.set(-18, 12, 20)
  scene.add(blue)

  const purple = new THREE.PointLight(0xa55cff, 1.0, 80)
  purple.position.set(22, -16, 18)
  scene.add(purple)
}

function setupDragPlane(scene: THREE.Scene) {
  dragPlane = new THREE.Mesh(
    new THREE.PlaneGeometry(220, 220),
    new THREE.MeshBasicMaterial({ visible: false }),
  )
  dragPlane.position.set(0, 0, 0)
  scene.add(dragPlane)
}


function animate() {
  animationId = requestAnimationFrame(animate)
  const controls = controlsRef.value
  const renderer = rendererRef.value
  const composer = composerRef.value
  const camera = cameraRef.value
  const scene = sceneRef.value

  if (!renderer || !camera || !scene) return
  controls?.update()
  if (composer) composer.render()
  else renderer.render(scene, camera)
}

function destroyThreeScene() {
  cancelAnimationFrame(animationId)
  cancelAnimationFrame(cameraTransitionFrame)
  window.removeEventListener('resize', onWindowResize)
  document.removeEventListener('fullscreenchange', handleFullscreenChange)
  canvasResizeObserver?.disconnect()
  canvasResizeObserver = null

  const renderer = rendererRef.value
  if (renderer) {
    renderer.domElement.removeEventListener('pointerdown', onPointerDown)
    renderer.domElement.removeEventListener('pointermove', onPointerMove)
    renderer.domElement.removeEventListener('pointerup', onPointerUp)
    renderer.domElement.removeEventListener('pointercancel', onPointerUp)
    renderer.domElement.removeEventListener('dblclick', onDoubleClickSelect)
  }

  clearScene(false)
  controlsRef.value?.dispose()
  rendererRef.value?.dispose()
  if (renderer?.domElement?.parentNode) renderer.domElement.parentNode.removeChild(renderer.domElement)
  sceneRef.value = null
  cameraRef.value = null
  rendererRef.value = null
  controlsRef.value = null
}

function onWindowResize() {
  const container = canvasWrapRef.value
  const camera = cameraRef.value
  const renderer = rendererRef.value
  const composer = composerRef.value
  if (!container || !camera || !renderer) return
  camera.aspect = container.clientWidth / container.clientHeight
  camera.updateProjectionMatrix()
  renderer.setSize(container.clientWidth, container.clientHeight)
  composer?.setSize(container.clientWidth, container.clientHeight)
}

function onPaletteDragStart(event: DragEvent, type: MoleculeType) {
  draggedPaletteType = type
  event.dataTransfer?.setData('molecule-type', type)
  if (event.dataTransfer) event.dataTransfer.effectAllowed = 'copy'
}

function onCanvasDrop(event: DragEvent) {
  event.preventDefault()
  if (currentMode.value === 'view') {
    draggedPaletteType = null
    ElMessage.warning('观察模式已锁定拖拽，请切换到构建模式或练习模式。平面 / 螺旋切换只用于观察。')
    return
  }

  const rawType = event.dataTransfer?.getData('molecule-type') || draggedPaletteType || ''
  if (!isMoleculeType(rawType)) {
    draggedPaletteType = null
    hintText.value = '没有识别到分子类型，请重新从左侧组件库拖入。'
    ElMessage.warning('没有识别到分子类型，请重新拖拽。')
    return
  }

  const point = getPointOnDragPlane(event.clientX, event.clientY)
  if (!point) {
    draggedPaletteType = null
    hintText.value = '当前位置无法放置分子，请稍微调整视角后再拖入。'
    ElMessage.warning('当前位置无法放置分子，请调整视角后再试。')
    return
  }

  createMolecule(rawType, point, { select: false })
  draggedPaletteType = null
  hintText.value = `已添加 ${getPalette(rawType).name}，按住可拖动位置；双击它再双击另一个分子可建立连接。`
}

function addMoleculeFromPalette(type: MoleculeType) {
  if (currentMode.value === 'view') {
    ElMessage.warning('观察模式不能添加分子，请切换到构建模式。')
    return
  }
  const index = molecules.length
  const x = ((index % 4) - 1.5) * 4.2
  const y = (1.5 - Math.floor(index / 4)) * 3.4
  createMolecule(type, new THREE.Vector3(x, y, 0), { select: false })
  hintText.value = `已添加 ${getPalette(type).name}。按住拖动位置；双击两个分子建立连接。`
}

function createMolecule(type: MoleculeType, position: THREE.Vector3, options: { select?: boolean; silent?: boolean } = {}) {
  const root = rootGroupRef.value
  if (!root) return null

  const config = getPalette(type)
  const id = `mol_${++moleculeSeq}`
  const group = new THREE.Group()
  const kind: MoleculeKind = type === 'sugar' || type === 'sugar_reverse' ? 'sugar' : type === 'phosphate' ? 'phosphate' : 'base'
  group.position.copy(position)
  group.userData = {
    isMolecule: true,
    id,
    type,
    kind,
    base: kind === 'base' ? (type as 'A' | 'T' | 'G' | 'C') : undefined,
    name: config.name,
    shortName: config.shortName,
    color: config.color,
    cssColor: config.cssColor,
    connections: [],
  } satisfies MoleculeData

  if (type === 'phosphate') buildPhosphateVisual(group, config)
  else if (type === 'sugar' || type === 'sugar_reverse') buildSugarVisual(group, config, type === 'sugar_reverse')
  else buildBaseVisual(group, config)

  group.scale.setScalar(MOLECULE_SCALE)
  root.add(group)
  molecules.push(group)
  if (!options.silent) fullStructureLayoutEntries = []
  if (options.select) selectMolecule(group)
  updateStats()
  updatePhosphateTerminalStubs()
  updateSugarDefaultFoldVisibility()
  if (!options.silent) ElMessage.success(`已添加：${config.name}`)
  return group
}

function buildPhosphateVisual(group: THREE.Group, config: PaletteItem) {
  const sphereMat = new THREE.MeshPhysicalMaterial({
    color: config.color,
    emissive: config.color,
    emissiveIntensity: 0.24,
    toneMapped: false,
    roughness: 0.22,
    metalness: 0.35,
    clearcoat: 0.7,
  })
  const sphere = new THREE.Mesh(new THREE.SphereGeometry(1.05, 36, 36), sphereMat)
  sphere.castShadow = true
  sphere.receiveShadow = true
  group.add(sphere)

  const label = createTextSprite('P', '#ffffff', 58)
  label.position.set(0, 0, 0.82)
  label.scale.set(1.62, 0.86, 1)
  group.add(label)
}

function buildSugarVisual(group: THREE.Group, config: PaletteItem, reverse = false) {
  const shape = createPolygonShape(5, 1.28, Math.PI / 2)
  const geometry = new THREE.ExtrudeGeometry(shape, { depth: 0.52, bevelEnabled: true, bevelSize: 0.08, bevelThickness: 0.08, bevelSegments: 2 })
  geometry.center()

  const mat = new THREE.MeshPhysicalMaterial({
    color: config.color,
    emissive: config.color,
    emissiveIntensity: 0.2,
    toneMapped: false,
    roughness: 0.2,
    metalness: 0.2,
    clearcoat: 0.6,
    transparent: true,
    opacity: 0.96,
  })
  const mesh = new THREE.Mesh(geometry, mat)
  mesh.castShadow = true
  mesh.receiveShadow = true
  group.add(mesh)

  const edges = new THREE.LineSegments(
    new THREE.EdgesGeometry(geometry),
    new THREE.LineBasicMaterial({ color: 0xd9fbff, transparent: true, opacity: 0.16 }),
  )
  group.add(edges)


  // v32：教材化五碳糖。红色氧原子 O 放在五边形顶点处；其余 4 个碳位沿顺时针标注 1/2/3/4，编号再次加大便于课堂投屏。
  // 氧原子与编号都作为脱氧核糖 Group 的子元素，不单独参与连接和拖拽。
  const oxygen = new THREE.Mesh(
    new THREE.SphereGeometry(0.24, 28, 28),
    new THREE.MeshPhysicalMaterial({
      color: 0xff4d4f,
      emissive: 0xff2020,
      emissiveIntensity: 0.16,
      toneMapped: false,
      roughness: 0.3,
      metalness: 0.05,
      clearcoat: 0.35,
    }),
  )
  oxygen.name = 'SugarRing_Oxygen'
  oxygen.position.set(0, 1.16, 0.5)
  oxygen.userData = { role: 'oxygen', parentMolecule: 'sugar' }
  group.add(oxygen)

  const oxygenLabel = createTextSprite('O', '#fff7f7', 24)
  oxygenLabel.position.set(0, 1.16, 0.82)
  oxygenLabel.scale.set(0.62, 0.32, 1)
  group.add(oxygenLabel)

  const carbonLabels = [
    { text: '1', x: 1.18, y: 0.40 },
    { text: '2', x: 0.72, y: -0.96 },
    { text: '3', x: -0.72, y: -0.96 },
    { text: '4', x: -1.18, y: 0.40 },
  ]
  carbonLabels.forEach((item) => {
    const label = createTextSprite(item.text, '#ffffff', 56)
    label.position.set(item.x, item.y, 0.92)
    label.scale.set(0.92, 0.5, 1)
    group.add(label)
  })

  // v37：五碳糖拖入后，默认在 4 号碳位保留一段 4→5 的单折线，并在折角处标记 5。
  // 这只是糖环自身的 5 号碳提示，不代表已经和磷酸形成连接。真正连接 P 后会自动隐藏这段默认提示，避免重复。
  const defaultFiveFold = createSugarDefaultFiveFoldVisual()
  defaultFiveFold.name = 'SugarDefaultFiveFold'
  group.add(defaultFiveFold)

  const label3 = createTextSprite("3'", '#aef6ff', 26)
  label3.position.set(1.36, -0.92, 0.56)
  label3.scale.set(0.72, 0.36, 1)
  group.add(label3)

  if (reverse) {
    // 反向脱氧核糖用于构建另一条反向平行链：整体旋转 180°，5'/3' 方向随之调换。
    group.rotation.z = Math.PI
  }
}


function createSugarDefaultFiveFoldVisual() {
  const group = new THREE.Group()
  group.userData = { isSugarDefaultFiveFold: true }

  // v70：拖入脱氧核糖时，默认 4→5 提示折线要明显卡入 4 号位，
  // 并且折角处不再有外溢的小尾巴。
  const start = getSugarLocalCarbonPoint('4').clone()
  start.x -= 0.078
  start.y += 0.03
  start.z = 0.28
  const corner = new THREE.Vector3(start.x - 0.25, start.y + 0.285, 0.28)
  const end = new THREE.Vector3(corner.x - 0.58, corner.y + 0.12, 0.28)
  const color = 0xaeb9c8

  // v74：默认 4→5 提示折线的 z 改到更接近糖环前表面。
  // 红色氧原子之所以看着“卡进去”，是因为它的球半径会回到糖环表面；
  // 黑线也要把中心放到靠近前表面的深度，才能真正贴住而不是悬在前面。
  group.add(createCylinderBetweenWithEndpointOverlap(start, corner, 0.088, color, 1, false, 0.22, 0))
  group.add(createCylinderBetweenWithEndpointOverlap(corner, end, 0.088, color, 1, false, 0, 0))

  const startJoint = new THREE.Mesh(
    new THREE.SphereGeometry(0.1, 18, 18),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 }),
  )
  startJoint.position.copy(start)
  group.add(startJoint)

  const joint = new THREE.Mesh(
    new THREE.SphereGeometry(0.088, 18, 18),
    new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 1 }),
  )
  joint.position.copy(corner)
  group.add(joint)

  const label5 = createTextSprite('5', '#dffbff', 40)
  label5.position.set(corner.x - 0.02, corner.y + 0.22, 0.88)
  label5.scale.set(0.72, 0.4, 1)
  group.add(label5)
  return group
}

function buildBaseVisual(group: THREE.Group, config: PaletteItem) {
  const isPurine = config.type === 'A' || config.type === 'G'
  if (isPurine) {
    const left = createBaseRing(config.color, 6, 0.86)
    left.position.x = -0.45
    const right = createBaseRing(config.color, 5, 0.78)
    right.position.x = 0.58
    group.add(left, right)

    const bridge = new THREE.Mesh(
      new THREE.BoxGeometry(0.42, 0.22, 0.28),
      new THREE.MeshPhysicalMaterial({ color: config.color, emissive: config.color, emissiveIntensity: 0.18, toneMapped: false, metalness: 0.22, roughness: 0.25 }),
    )
    bridge.position.z = 0.02
    group.add(bridge)
  } else {
    const ring = createBaseRing(config.color, 6, 1.02)
    group.add(ring)
  }


  const letter = createTextSprite(config.shortName, '#ffffff', 66)
  letter.position.set(0, 0.03, 0.58)
  letter.scale.set(1.38, 0.78, 1)
  group.add(letter)

}

function createBaseRing(color: number, sides: number, radius: number) {
  const outer = createPolygonShape(sides, radius, Math.PI / 6)
  const hole = createPolygonPath(sides, radius * 0.58, Math.PI / 6)
  outer.holes.push(hole)
  const geo = new THREE.ExtrudeGeometry(outer, { depth: 0.32, bevelEnabled: true, bevelSize: 0.035, bevelThickness: 0.035, bevelSegments: 2 })
  geo.center()
  const mat = new THREE.MeshPhysicalMaterial({
    color,
    emissive: color,
    emissiveIntensity: 0.22,
    toneMapped: false,
    metalness: 0.22,
    roughness: 0.22,
    clearcoat: 0.55,
    transparent: true,
    opacity: 0.96,
  })
  const group = new THREE.Group()
  const mesh = new THREE.Mesh(geo, mat)
  mesh.castShadow = true
  group.add(mesh)
  group.add(new THREE.LineSegments(new THREE.EdgesGeometry(geo), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.13 })))
  return group
}

function createPolygonShape(sides: number, radius: number, startAngle = 0) {
  const shape = new THREE.Shape()
  for (let i = 0; i <= sides; i++) {
    const angle = startAngle + (i / sides) * Math.PI * 2
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius
    if (i === 0) shape.moveTo(x, y)
    else shape.lineTo(x, y)
  }
  return shape
}

function createPolygonPath(sides: number, radius: number, startAngle = 0) {
  const path = new THREE.Path()
  for (let i = 0; i <= sides; i++) {
    const angle = startAngle + (i / sides) * Math.PI * 2
    const x = Math.cos(angle) * radius
    const y = Math.sin(angle) * radius
    if (i === 0) path.moveTo(x, y)
    else path.lineTo(x, y)
  }
  return path
}


function createTextSprite(text: string, color = '#ffffff', fontSize = 42) {
  const lines = text.split('\n')
  const canvas = document.createElement('canvas')
  canvas.width = 256
  canvas.height = 128
  const ctx = canvas.getContext('2d')!
  ctx.clearRect(0, 0, canvas.width, canvas.height)
  ctx.font = `700 ${fontSize}px "Microsoft YaHei", Arial, sans-serif`
  ctx.textAlign = 'center'
  ctx.textBaseline = 'middle'
  ctx.shadowColor = 'rgba(0, 255, 255, 0.32)'
  ctx.shadowBlur = 2
  ctx.fillStyle = color
  const lineHeight = fontSize * 1.05
  const startY = canvas.height / 2 - ((lines.length - 1) * lineHeight) / 2
  lines.forEach((line, index) => ctx.fillText(line, canvas.width / 2, startY + index * lineHeight))

  const texture = new THREE.CanvasTexture(canvas)
  texture.needsUpdate = true
  const material = new THREE.SpriteMaterial({ map: texture, transparent: true, depthWrite: false, depthTest: false })
  const sprite = new THREE.Sprite(material)
  sprite.renderOrder = 20
  return sprite
}

// 二维平面交互：点击分子拖动；双击两个分子建立连接；双击连接线删除连接。
function onPointerDown(event: PointerEvent) {
  if (currentMode.value === 'view') return
  const picked = pickMolecule(event.clientX, event.clientY)
  if (!picked) return

  const point = getPointOnDragPlane(event.clientX, event.clientY)
  if (!point) return

  isDragging = true
  dragMoved = false
  dragObject = picked
  activePointerId = event.pointerId
  dragOffset.copy(point).sub(picked.position)
  selectedGroup.value && selectedGroup.value !== picked && selectedGroup.value.scale.setScalar(MOLECULE_SCALE)
  selectedGroup.value = picked
  picked.scale.setScalar(MOLECULE_DRAG_SCALE)
  selectedInfo.value = {
    id: getMoleculeData(picked).id,
    name: getMoleculeData(picked).name,
    detail: getSelectedDetail(getMoleculeData(picked)),
  }
  controlsRef.value && (controlsRef.value.enabled = false)
  rendererRef.value?.domElement.setPointerCapture(event.pointerId)
}

function onPointerMove(event: PointerEvent) {
  if (!isDragging || !dragObject || activePointerId !== event.pointerId) return
  const point = getPointOnDragPlane(event.clientX, event.clientY)
  if (!point) return
  const next = point.clone().sub(dragOffset)
  next.z = 0
  if (dragObject.position.distanceTo(next) > 0.02) dragMoved = true
  dragObject.position.copy(next)
  fullStructureLayoutEntries = []
  updateConnectedBonds(dragObject)
}

function onPointerUp(event: PointerEvent) {
  if (activePointerId !== event.pointerId) return
  const target = dragObject
  isDragging = false
  dragObject = null
  activePointerId = null
  controlsRef.value && (controlsRef.value.enabled = true)
  try {
    rendererRef.value?.domElement.releasePointerCapture(event.pointerId)
  } catch { }

  if (target) {
    target.scale.setScalar(selectedGroup.value === target ? MOLECULE_SELECTED_SCALE : MOLECULE_SCALE)
    selectMolecule(target)
    if (dragMoved) hintText.value = `已移动：${getMoleculeData(target).shortName}。如需连接，请先双击它，再双击目标分子。`
  }
  dragMoved = false
}

function onDoubleClickSelect(event: MouseEvent) {
  if (currentMode.value === 'view') return

  const pickedMolecule = pickMolecule(event.clientX, event.clientY)
  if (pickedMolecule) {
    handleMoleculeDoubleClick(pickedMolecule)
    return
  }

  const pickedBond = pickBond(event.clientX, event.clientY)
  if (pickedBond) {
    removeBond(pickedBond)
    updateStats()
    const msg = `已删除连接：${getMoleculeData(pickedBond.a).shortName} - ${getMoleculeData(pickedBond.b).shortName}`
    hintText.value = msg
    ElMessage.success(msg)
  }
}

function handleMoleculeDoubleClick(group: THREE.Group) {
  const data = getMoleculeData(group)
  selectMolecule(group)

  if (!connectionStartGroup.value) {
    connectionStartGroup.value = group
    hintText.value = `已选择连接起点：${data.shortName}。请再双击另一个分子建立连接。`
    ElMessage.success(`连接起点：${data.shortName}`)
    return
  }

  const first = connectionStartGroup.value
  if (first === group) {
    connectionStartGroup.value = null
    hintText.value = '已取消连接起点。'
    ElMessage.info('已取消连接起点')
    return
  }

  attemptManualConnection(first, group)
  connectionStartGroup.value = null
}

function attemptManualConnection(a: THREE.Group, b: THREE.Group) {
  if (hasBond(a, b)) {
    hintText.value = '这两个分子已经建立过连接。'
    ElMessage.info('这两个分子已经建立过连接')
    return
  }

  const rule = getConnectionRule(a, b)
  if (!rule?.valid) {
    flashMolecule(a, 0xff3333)
    flashMolecule(b, 0xff3333)
    const reason = getInvalidReason(a, b)
    hintText.value = reason
    ElMessage.warning(reason)
    return
  }

  const portError = validateSugarPhosphatePort(a, b, rule)
  if (portError) {
    flashMolecule(a, 0xfff04d)
    flashMolecule(b, 0xfff04d)
    hintText.value = portError
    ElMessage.warning(portError)
    return
  }

  createBond(a, b, rule)
}

function pickBond(clientX: number, clientY: number) {
  updateRaycaster(clientX, clientY)
  const bondVisuals: THREE.Object3D[] = []
  bonds.forEach((bond) => {
    bond.group.traverse((child) => {
      if (child !== bond.group) bondVisuals.push(child)
    })
  })

  if (!bondVisuals.length) return null
  const intersects = raycaster.intersectObjects(bondVisuals, true)
  for (const hit of intersects) {
    const bond = findBondFromObject(hit.object)
    if (bond) return bond
  }
  return null
}

function findBondFromObject(object: THREE.Object3D | null): BondData | null {
  let cur: THREE.Object3D | null = object
  while (cur) {
    const bondId = cur.userData?.bondId
    if (bondId) return bonds.find((bond) => bond.id === bondId) || null
    if (cur.userData?.isBond && cur.userData?.bondId) return bonds.find((bond) => bond.id === cur.userData.bondId) || null
    cur = cur.parent
  }
  return null
}

function pickMolecule(clientX: number, clientY: number) {
  const camera = cameraRef.value
  if (!camera) return null
  updateRaycaster(clientX, clientY)
  const intersects = raycaster.intersectObjects(molecules, true)
  for (const hit of intersects) {
    const root = findMoleculeRoot(hit.object)
    if (root) return root
  }
  return null
}


function findMoleculeRoot(object: THREE.Object3D | null): THREE.Group | null {
  let cur: THREE.Object3D | null = object
  while (cur) {
    if (cur.userData?.isMolecule) return cur as THREE.Group
    cur = cur.parent
  }
  return null
}

function updateRaycaster(clientX: number, clientY: number) {
  const renderer = rendererRef.value
  const camera = cameraRef.value
  if (!renderer || !camera) return
  const rect = renderer.domElement.getBoundingClientRect()
  mouse.x = ((clientX - rect.left) / rect.width) * 2 - 1
  mouse.y = -((clientY - rect.top) / rect.height) * 2 + 1
  raycaster.setFromCamera(mouse, camera)
}

function getPointOnDragPlane(clientX: number, clientY: number) {
  const camera = cameraRef.value
  if (!camera) return null
  updateRaycaster(clientX, clientY)

  // 二维平面效果：所有分子都放在 z=0 的构建平面，不随视角旋转。
  const plane = new THREE.Plane(new THREE.Vector3(0, 0, 1), 0)
  const point = new THREE.Vector3()
  const hit = raycaster.ray.intersectPlane(plane, point)
  return hit ? point.clone() : null
}

function getConnectionRule(a: THREE.Group, b: THREE.Group): BondRule | null {
  const ta = getConnectionKey(a)
  const tb = getConnectionKey(b)
  return connectionRules[`${ta}-${tb}`] || null
}

function getConnectionKey(group: THREE.Group) {
  const data = getMoleculeData(group)
  if (data.kind === 'base') return data.base || data.type
  if (data.kind === 'sugar') return 'sugar'
  return data.type
}

function getInvalidReason(a: THREE.Group, b: THREE.Group) {
  const ta = getConnectionKey(a)
  const tb = getConnectionKey(b)
  const dataA = getMoleculeData(a)
  const dataB = getMoleculeData(b)

  const baseCodes = ['A', 'T', 'G', 'C']
  if (baseCodes.includes(ta) && baseCodes.includes(tb)) {
    if ((ta === 'A' || ta === 'T') && !(ta === 'A' && tb === 'T') && !(ta === 'T' && tb === 'A')) {
      return `❌ 配对错误：${ta} 不能与 ${tb} 配对。A 只与 T 配对，形成 2 个氢键。`
    }
    if ((ta === 'G' || ta === 'C') && !(ta === 'G' && tb === 'C') && !(ta === 'C' && tb === 'G')) {
      return `❌ 配对错误：${ta} 不能与 ${tb} 配对。G 只与 C 配对，形成 3 个氢键。`
    }
  }

  if (ta === 'phosphate' && tb === 'phosphate') return '❌ 两个磷酸基团不能直接构成 DNA 骨架，需要通过脱氧核糖连接。'
  if (ta === 'sugar' && tb === 'sugar') return '❌ 两个脱氧核糖不能直接连接，DNA 骨架中糖与磷酸交替连接。'
  return `❌ 科学错误：${dataA.shortName} 与 ${dataB.shortName} 之间不应直接连接。`
}

function createBond(a: THREE.Group, b: THREE.Group, rule: BondRule, options: { silent?: boolean; sugarPort?: SugarBackbonePort } = {}) {
  const root = rootGroupRef.value
  if (!root) return
  const bondGroup = new THREE.Group()
  bondGroup.userData = { isBond: true }
  root.add(bondGroup)

  const sugarPort = rule.bondType === 'ester' ? (options.sugarPort || chooseSugarPhosphatePortForBond(a, b)) : undefined

  const bond: BondData = {
    id: `bond_${++bondSeq}`,
    a,
    b,
    group: bondGroup,
    bondType: rule.bondType,
    name: rule.name,
    count: rule.count || 1,
    sugarPort,
  }
  bonds.push(bond)
  bond.group.userData.bondId = bond.id

  const ad = getMoleculeData(a)
  const bd = getMoleculeData(b)
  ad.connections.push(bond.id)
  bd.connections.push(bond.id)

  rebuildBondVisual(bond)
  updateStats()
  updatePhosphateTerminalStubs()
  updateSugarDefaultFoldVisibility()
  const message = rule.bondType === 'hydrogen'
    ? `✅ 配对成功：${getConnectionKey(a)} 与 ${getConnectionKey(b)} 形成 ${rule.count} 条氢键。`
    : `✅ 连接成功：形成 ${rule.name}。`
  if (!options.silent) {
    hintText.value = message
    ElMessage.success(message)
  }
}

function rebuildBondVisual(bond: BondData) {
  disposeObjectChildren(bond.group)
  bond.group.clear()

  if (bond.bondType === 'hydrogen') {
    createHydrogenBondDots(bond.group, bond.a, bond.b, bond.count)
  } else {
    // v70：P-糖骨架线统一黑色，其他连接（糖-碱基、碱基间配对）统一红色；并整体加粗一些，便于 3D 打印。
    const esterColor = 0xaeb9c8
    const otherColor = 0xaeb9c8
    if (bond.bondType === 'ester') {
      bond.group.add(createBackboneFoldTubeForBond(bond, 0.13, esterColor, 1, false))
    } else {
      bond.group.add(createGlycosidicTubeForBond(bond, 0.108, otherColor, 1, false))
    }
  }

  // v10：给每次重建出来的连接线 / 氢键点都打上 bondId，方便双击命中后反查并删除。
  bond.group.userData.bondId = bond.id
  bond.group.traverse((child) => {
    child.userData.bondId = bond.id
    child.userData.isBondPart = true
  })
}

function getBaseHydrogenAnchorSeriesRootLocal(base: THREE.Group, toward: THREE.Vector3, count: number) {
  const root = rootGroupRef.value
  const center = base.position.clone()
  const dirRoot = toward.clone().sub(center)
  if (dirRoot.lengthSq() < 0.0001) return [center.clone()]
  if (!root) return [center.add(dirRoot.normalize().multiplyScalar(getBaseConnectRadius(base) * 0.9))]

  root.updateWorldMatrix(true, false)
  base.updateWorldMatrix(true, false)
  const towardWorld = root.localToWorld(toward.clone())
  const towardLocal = base.worldToLocal(towardWorld.clone())
  const side = towardLocal.x >= 0 ? 1 : -1
  const data = getMoleculeData(base)

  // v83：不要再用“中心锚点 + 横向平移”去画氢键，
  // 那样在螺旋角度下很容易有一根线穿过 A/G/C/T 的镂空中心。
  // 改成每个碱基都使用一组固定的“边缘锚点”，让每根线分别卡在实体边缘上。
  let xs: number[] = []
  let ys: number[] = []

  if (data.type === 'A' || data.type === 'G') {
    // 双环嘌呤：锚点靠近双环实体的配对边缘，不落在中空区。
    const x = side > 0 ? 0.92 : -0.92
    xs = count === 3 ? [x, x, x] : [x, x]
    ys = count === 3 ? [-0.34, 0, 0.34] : [-0.24, 0.24]
  } else {
    // 单环嘧啶：锚点放在六边形左右实体边缘。
    const x = side > 0 ? 0.76 : -0.76
    xs = count === 3 ? [x, x, x] : [x, x]
    ys = count === 3 ? [-0.34, 0, 0.34] : [-0.22, 0.22]
  }

  const z = THREE.MathUtils.clamp(towardLocal.z * 0.05, -0.03, 0.03)
  return xs.map((x, index) => toRootLocalPoint(base.localToWorld(new THREE.Vector3(x, ys[index] ?? 0, z))))
}

function createHydrogenBondDots(group: THREE.Group, a: THREE.Group, b: THREE.Group, count: number) {
  // v95 演示版：A-T / G-C 红色配对线改成虚线，突出“氢键”不是糖-磷酸骨架的实体连续键。
  const color = 0xe55353
  const aAnchors = getBaseHydrogenAnchorSeriesRootLocal(a, b.position, count)
  const bAnchors = getBaseHydrogenAnchorSeriesRootLocal(b, a.position, count)
  const lines = Math.min(count, aAnchors.length, bAnchors.length)

  for (let lineIndex = 0; lineIndex < lines; lineIndex++) {
    const radius = count === 3 && lineIndex === 1 ? 0.044 : 0.062
    const s = aAnchors[lineIndex]
    const e = bAnchors[lineIndex]
    group.add(createDashedCylinderBetweenWithEndpointOverlap(s, e, radius, color, 1, false, 0.02, 0.02, 0.3, 0.18))
  }
}

function createDashedCylinderBetweenWithEndpointOverlap(
  start: THREE.Vector3,
  end: THREE.Vector3,
  radius: number,
  color: number,
  opacity: number,
  additive = false,
  startOverlap = 0,
  endOverlap = 0,
  dashLength = 0.3,
  gapLength = 0.18,
) {
  const direction = end.clone().sub(start)
  const rawLength = direction.length()
  const group = new THREE.Group()
  if (rawLength < 0.0001) return group

  const unit = direction.clone().normalize()
  const maxOverlap = rawLength * 0.12
  const realStart = start.clone().add(unit.clone().multiplyScalar(-Math.min(Math.max(startOverlap, 0), maxOverlap)))
  const realEnd = end.clone().add(unit.clone().multiplyScalar(Math.min(Math.max(endOverlap, 0), maxOverlap)))
  const realDirection = realEnd.clone().sub(realStart)
  const totalLength = realDirection.length()
  if (totalLength < 0.0001) return group

  const dash = Math.max(0.08, dashLength)
  const gap = Math.max(0.05, gapLength)
  let cursor = 0
  while (cursor < totalLength - 0.02) {
    const segmentEndDistance = Math.min(cursor + dash, totalLength)
    if (segmentEndDistance - cursor > 0.035) {
      const segmentStart = realStart.clone().add(unit.clone().multiplyScalar(cursor))
      const segmentEnd = realStart.clone().add(unit.clone().multiplyScalar(segmentEndDistance))
      group.add(createCylinderBetweenWithEndpointOverlap(segmentStart, segmentEnd, radius, color, opacity, additive, 0, 0))
    }
    cursor += dash + gap
  }

  return group
}

function createCylinderBetween(start: THREE.Vector3, end: THREE.Vector3, radius: number, color: number, opacity: number, additive = false, overlap = 0.08) {
  const direction = end.clone().sub(start)
  const rawLength = direction.length()
  if (rawLength < 0.0001) return new THREE.Group()

  // v65：所有连接线都做成“嵌入式实体线”。
  // 起点和终点各向连接方向外延一点，让圆柱线段真正插入相邻 Mesh，
  // 避免课堂近看和 3D 打印时出现线与分子之间的缝隙。
  const unit = direction.clone().normalize()
  const safeOverlap = Math.min(Math.max(overlap, radius * 0.85), rawLength * 0.18)
  const realStart = start.clone().add(unit.clone().multiplyScalar(-safeOverlap))
  const realEnd = end.clone().add(unit.clone().multiplyScalar(safeOverlap))
  const realDirection = realEnd.clone().sub(realStart)
  const length = realDirection.length()

  const geometry = new THREE.CylinderGeometry(radius, radius, length, 20, 1)
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: opacity < 0.999,
    opacity,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    depthWrite: true,
  })
  const cylinder = new THREE.Mesh(geometry, material)
  cylinder.position.copy(realStart.clone().add(realEnd).multiplyScalar(0.5))
  cylinder.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), realDirection.normalize())
  return cylinder
}



function createCylinderBetweenWithEndpointOverlap(
  start: THREE.Vector3,
  end: THREE.Vector3,
  radius: number,
  color: number,
  opacity: number,
  additive = false,
  startOverlap = 0,
  endOverlap = 0,
) {
  const direction = end.clone().sub(start)
  const rawLength = direction.length()
  if (rawLength < 0.0001) return new THREE.Group()

  const unit = direction.clone().normalize()
  const maxOverlap = rawLength * 0.32
  const realStart = start.clone().add(unit.clone().multiplyScalar(-Math.min(Math.max(startOverlap, 0), maxOverlap)))
  const realEnd = end.clone().add(unit.clone().multiplyScalar(Math.min(Math.max(endOverlap, 0), maxOverlap)))
  const realDirection = realEnd.clone().sub(realStart)
  const length = realDirection.length()

  const geometry = new THREE.CylinderGeometry(radius, radius, length, 20, 1)
  const material = new THREE.MeshBasicMaterial({
    color,
    transparent: opacity < 0.999,
    opacity,
    blending: additive ? THREE.AdditiveBlending : THREE.NormalBlending,
    depthWrite: true,
  })
  const cylinder = new THREE.Mesh(geometry, material)
  cylinder.position.copy(realStart.clone().add(realEnd).multiplyScalar(0.5))
  cylinder.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), realDirection.normalize())
  return cylinder
}

function getSugarLocalCarbonPoint(label: '1' | '2' | '3' | '4') {
  const points = {
    '1': new THREE.Vector3(1.18, 0.4, 0.2),
    '2': new THREE.Vector3(0.72, -0.96, 0.2),
    '3': new THREE.Vector3(-0.72, -0.96, 0.2),
    '4': new THREE.Vector3(-1.18, 0.4, 0.2),
  }
  return points[label].clone()
}

function toRootLocalPoint(worldPoint: THREE.Vector3) {
  const root = rootGroupRef.value
  if (!root) return worldPoint.clone()
  root.updateWorldMatrix(true, false)
  return root.worldToLocal(worldPoint.clone())
}

function getSugarVertexAnchorWorld(sugar: THREE.Group, label: '1' | '2' | '3' | '4') {
  sugar.updateWorldMatrix(true, false)
  // 注意：连接线 bondGroup 是挂在 rootGroup 下面的。
  // 如果自动旋转时 rootGroup 有 rotation，localToWorld 得到的是世界坐标；
  // 直接拿世界坐标去 rootGroup 子节点里画线，会导致连接线错位、飞线。
  // 所以这里统一转回 rootGroup 的局部坐标。函数名保留，避免大范围改调用。
  return toRootLocalPoint(sugar.localToWorld(getSugarLocalCarbonPoint(label)))
}

function getSugarOxygenAnchorWorld(sugar: THREE.Group) {
  sugar.updateWorldMatrix(true, false)
  return toRootLocalPoint(sugar.localToWorld(new THREE.Vector3(0, 1.16, 0.5)))
}

function getBaseConnectRadius(group: THREE.Group) {
  const data = getMoleculeData(group)
  const baseRadius = data.type === 'A' || data.type === 'G' ? 1.22 : 1.08
  return baseRadius * Math.max(group.scale.x || 1, group.scale.y || 1) * 0.98
}


function getBaseHydrogenAnchorRootLocal(base: THREE.Group, toward: THREE.Vector3) {
  const root = rootGroupRef.value
  const center = base.position.clone()
  const dirRoot = toward.clone().sub(center)
  if (dirRoot.lengthSq() < 0.0001) return center
  if (!root) return center.add(dirRoot.normalize().multiplyScalar(getBaseConnectRadius(base) * 0.92))

  root.updateWorldMatrix(true, false)
  base.updateWorldMatrix(true, false)
  const towardWorld = root.localToWorld(toward.clone())
  const towardLocal = base.worldToLocal(towardWorld.clone())
  const planarDir = new THREE.Vector3(towardLocal.x, towardLocal.y, 0)
  if (planarDir.lengthSq() < 0.0001) return center
  planarDir.normalize()

  const data = getMoleculeData(base)
  const dir2 = new THREE.Vector2(planarDir.x, planarDir.y).normalize()
  const signX = dir2.x >= 0 ? 1 : -1
  const yBias = THREE.MathUtils.clamp(dir2.y * 0.12, -0.08, 0.08)
  const zBias = THREE.MathUtils.clamp(towardLocal.z * 0.08, -0.04, 0.04)
  let localPoint = new THREE.Vector3()

  if (data.type === 'A' || data.type === 'G') {
    // v82：氢键锚点固定落在双环实体外缘，避免穿进 A/G 的镂空中心。
    localPoint.set(signX > 0 ? 1.08 : -0.98, yBias, zBias)
  } else {
    // T / C 落在六边形实体左右边缘，同样保持轻微内收。
    localPoint.set(signX * 0.88, yBias, zBias)
  }
  return toRootLocalPoint(base.localToWorld(localPoint))
}

function getBaseSurfaceAnchorRootLocal(base: THREE.Group, toward: THREE.Vector3) {
  const root = rootGroupRef.value
  const center = base.position.clone()
  const dirRoot = toward.clone().sub(center)
  if (dirRoot.lengthSq() < 0.0001) return center

  // v78：碱基连接点既要埋进分子，又要兼顾螺旋模式的前后厚度。
  // 固定 z 会导致 G-C / A-T 在侧视螺旋下看起来有缝；这里按目标分子所在方向选择碱基厚度侧。
  if (root) {
    root.updateWorldMatrix(true, false)
    base.updateWorldMatrix(true, false)
    const towardWorld = root.localToWorld(toward.clone())
    const towardLocal = base.worldToLocal(towardWorld.clone())
    const planarDir = new THREE.Vector3(towardLocal.x, towardLocal.y, 0)

    if (planarDir.lengthSq() > 0.0001) {
      planarDir.normalize()
      const data = getMoleculeData(base)
      const scale = Math.max(base.scale.x || 1, base.scale.y || 1)
      let support = 1.02

      if (data.type === 'A' || data.type === 'G') {
        const leftCenter = new THREE.Vector2(-0.45, 0)
        const rightCenter = new THREE.Vector2(0.58, 0)
        const dir2 = new THREE.Vector2(planarDir.x, planarDir.y).normalize()
        support = Math.max(leftCenter.dot(dir2) + 0.84, rightCenter.dot(dir2) + 0.76)
      } else {
        support = 0.98
      }

      const localPoint = planarDir.multiplyScalar(Math.max(0.18, support * scale - 0.12))
      localPoint.z = THREE.MathUtils.clamp(towardLocal.z * 0.28, -0.13, 0.13)
      return toRootLocalPoint(base.localToWorld(localPoint))
    }
  }

  return center.add(dirRoot.normalize().multiplyScalar(getBaseConnectRadius(base) * 0.9))
}

function getPhosphateSurfaceAnchorRootLocal(phosphate: THREE.Group, toward: THREE.Vector3) {
  const center = phosphate.position.clone()
  const dir = toward.clone().sub(center)
  if (dir.lengthSq() < 0.0001) return center
  // 稍微进入球体表面一点，避免 3D 打印时出现肉眼可见缝隙。
  const radius = 1.05 * Math.max(phosphate.scale.x || 1, phosphate.scale.y || 1) * 0.92
  return center.add(dir.normalize().multiplyScalar(radius))
}

function getSugarBaseAnchorWorld(sugar: THREE.Group) {
  // v75：糖-碱基连接点也稍微回收到糖环厚度里，避免糖苷键从 1 号位边缘“超出来”。
  sugar.updateWorldMatrix(true, false)
  const p = getSugarLocalCarbonPoint('1')
  p.x -= 0.04
  p.y -= 0.01
  p.z = 0.04
  return toRootLocalPoint(sugar.localToWorld(p))
}

function createGlycosidicTubeForBond(bond: BondData, radius: number, color: number, opacity: number, additive = false) {
  const aData = getMoleculeData(bond.a)
  const bData = getMoleculeData(bond.b)
  let start = bond.a.position.clone()
  let end = bond.b.position.clone()

  if (aData.kind === 'sugar' && bData.kind === 'base') {
    start = getSugarBaseAnchorWorld(bond.a)
    end = getBaseSurfaceAnchorRootLocal(bond.b, start)
  } else if (aData.kind === 'base' && bData.kind === 'sugar') {
    end = getSugarBaseAnchorWorld(bond.b)
    start = getBaseSurfaceAnchorRootLocal(bond.a, end)
  } else {
    if (aData.kind === 'sugar') start = getSugarBaseAnchorWorld(bond.a)
    if (bData.kind === 'sugar') end = getSugarBaseAnchorWorld(bond.b)
  }

  const group = new THREE.Group()
  group.add(createCylinderBetween(start, end, radius, color, opacity, additive))
  return group
}

function getAvailableSugarPhosphatePort(sugar: THREE.Group): SugarBackbonePort | null {
  const occupied = getOccupiedSugarBackbonePorts(sugar)
  // v37：手动连接第一颗 P 时，不再根据 P 在糖左边/右边切换端口；优先走 4→5 端。
  // 这样把 P 拖到糖左侧或右侧，第一次连接都不会突然变成 3 号端。
  if (!occupied.has('5')) return '5'
  if (!occupied.has('3')) return '3'
  return null
}

function chooseSugarPhosphatePortForBond(a: THREE.Group, b: THREE.Group): SugarBackbonePort | undefined {
  const aData = getMoleculeData(a)
  const bData = getMoleculeData(b)
  const sugar = aData.kind === 'sugar' ? a : bData.kind === 'sugar' ? b : null
  if (!sugar) return undefined
  return getAvailableSugarPhosphatePort(sugar) || undefined
}

function getSugarPhosphatePortForBond(bond: BondData, sugar: THREE.Group): SugarBackbonePort {
  if (bond.sugarPort) return bond.sugarPort
  // 兼容旧数据：没有记录端口时，优先显示为 4→5 端。
  return '5'
}

function getSugarBackboneAnchorWorld(sugar: THREE.Group, phosphate: THREE.Group, port: SugarBackbonePort) {
  const carbonLabel: '3' | '4' = port === '5' ? '4' : '3'
  sugar.updateWorldMatrix(true, false)
  phosphate.updateWorldMatrix(true, false)
  return {
    point: getSugarVertexAnchorWorld(sugar, carbonLabel),
    // v37：4→5 端使用糖自身预设的折线角度；3 号端向相反方向折。
    sideSign: port === '5' ? 1 : -1,
    port,
    carbonLabel,
  }
}

function getOccupiedSugarBackbonePorts(sugar: THREE.Group) {
  const occupied = new Set<SugarBackbonePort>()
  bonds.forEach((bond) => {
    if (bond.bondType !== 'ester') return
    if (bond.a !== sugar && bond.b !== sugar) return
    const other = bond.a === sugar ? bond.b : bond.a
    if (getMoleculeData(other).type !== 'phosphate') return
    occupied.add(getSugarPhosphatePortForBond(bond, sugar))
  })
  return occupied
}

function validateSugarPhosphatePort(a: THREE.Group, b: THREE.Group, rule: BondRule) {
  if (rule.bondType !== 'ester') return ''
  const aData = getMoleculeData(a)
  const bData = getMoleculeData(b)
  const sugar = aData.kind === 'sugar' ? a : bData.kind === 'sugar' ? b : null
  const phosphate = aData.type === 'phosphate' ? a : bData.type === 'phosphate' ? b : null
  if (!sugar || !phosphate) return ''

  const occupied = getOccupiedSugarBackbonePorts(sugar)
  const port = getAvailableSugarPhosphatePort(sugar)
  if (!port || occupied.size >= 2) return '❌ 连接不科学：一个脱氧核糖最多只能通过 3 号端和 4→5 端连接两个磷酸基团。'
  return ''
}


function getExistingPhosphateFoldSign(phosphate: THREE.Group, currentBondId: string) {
  const matched = bonds.find((item) => {
    if (item.id === currentBondId || item.bondType !== 'ester') return false
    if (item.a !== phosphate && item.b !== phosphate) return false
    return typeof item.foldSign === 'number'
  })
  return typeof matched?.foldSign === 'number' ? matched.foldSign : undefined
}

function createBackboneFoldTubeForBond(bond: BondData, radius: number, color: number, opacity: number, additive = false) {
  const aData = getMoleculeData(bond.a)
  const bData = getMoleculeData(bond.b)
  const sugar = aData.kind === 'sugar' ? bond.a : bData.kind === 'sugar' ? bond.b : null
  const phosphate = aData.type === 'phosphate' ? bond.a : bData.type === 'phosphate' ? bond.b : null

  // 兜底：理论上 ester 一定是糖—磷酸，如果数据异常就退回普通直线，避免画面崩。
  if (!sugar || !phosphate) {
    const group = new THREE.Group()
    group.add(createCylinderBetween(bond.a.position, bond.b.position, radius, color, opacity, additive))
    return group
  }

  const sugarData = getMoleculeData(sugar)
  const port = getSugarPhosphatePortForBond(bond, sugar)
  const anchor = getSugarBackboneAnchorWorld(sugar, phosphate, port)
  const start = anchor.point
  const end = getPhosphateSurfaceAnchorRootLocal(phosphate, start)

  // v44：3' 端连接 P 时必须使用直线，不要折角；只有 4'→5'→P 端才保留“只折一下”的折线并标 5。
  if (port === '3') {
    const group = new THREE.Group()
    group.add(createCylinderBetween(start, end, radius, color, opacity, additive))
    return group
  }

  const directionSign = sugarData.type === 'sugar_reverse' ? -1 : 1
  let foldSign = bond.foldSign

  // v48：折线方向只在连接创建后的第一次绘制时确定一次。
  // 后续拖动分子只更新起点 / 终点，不再重新判断向上折或向下折，避免折线突然翻转。
  if (typeof foldSign !== 'number') {
    // v51：同一个 P 桥接两个脱氧核糖时，折线折向固定一致；
    // 不再根据拖动位置或避让氧原子反复切换，避免出现一边向上、一边向下。
    const existingFoldSign = getExistingPhosphateFoldSign(phosphate, bond.id)
    foldSign = typeof existingFoldSign === 'number' ? existingFoldSign : anchor.sideSign * directionSign
    bond.foldSign = foldSign
  }

  return createSingleFoldTubeBetween(start, end, radius, color, opacity, foldSign, additive, anchor.port)
}

function chooseFoldSignAwayFromOxygen(sugar: THREE.Group, start: THREE.Vector3, end: THREE.Vector3, preferredSign: number) {
  const oxygen = getSugarOxygenAnchorWorld(sugar)
  const positive = calcSingleFoldCorner(start, end, preferredSign >= 0 ? 1 : -1, '5')
  const negative = calcSingleFoldCorner(start, end, preferredSign >= 0 ? -1 : 1, '5')
  return positive.distanceTo(oxygen) >= negative.distanceTo(oxygen) ? (preferredSign >= 0 ? 1 : -1) : (preferredSign >= 0 ? -1 : 1)
}

function calcSingleFoldCorner(start: THREE.Vector3, end: THREE.Vector3, foldSign = 1, port: SugarBackbonePort = '3') {
  const direction = end.clone().sub(start)
  const length = direction.length()
  const isPlaneView = structureViewMode.value === 'plane'

  // v67：平面模式下把糖—磷酸骨架的折角做得更明显一些，避免视觉上像直线。
  // 做法：
  // 1）折角更靠近糖端，让折一下的感觉更明显；
  // 2）垂向偏移加大，提升折线夹角；
  // 3）螺旋模式保持相对克制，避免骨架过度夸张。
  const lerpT = port === '5' ? (isPlaneView ? 0.24 : 0.34) : (isPlaneView ? 0.34 : 0.42)
  const corner = start.clone().lerp(end, lerpT)
  const bendBase = port === '5' ? (isPlaneView ? 0.82 : 0.38) : (isPlaneView ? 0.46 : 0.26)
  const bendLimitMax = isPlaneView ? 0.92 : 0.42
  const bendLimitMin = isPlaneView ? 0.30 : 0.16
  const bend = Math.min(bendLimitMax, Math.max(bendLimitMin, length * (isPlaneView ? 0.16 : 0.1))) * (bendBase / 0.32) * (foldSign >= 0 ? 1 : -1)

  corner.y += bend
  corner.z = (start.z + end.z) / 2
  return corner
}

function createSingleFoldTubeBetween(start: THREE.Vector3, end: THREE.Vector3, radius: number, color: number, opacity: number, foldSign = 1, additive = false, port: SugarBackbonePort = '3') {
  const direction = end.clone().sub(start)
  const length = direction.length()
  const group = new THREE.Group()
  if (length < 0.001) return group

  // 只折一下：起点 -> 折角点 -> 终点。
  // 当连接 4 号端时，折角点表示 5 号碳，所以在折角处标注 5。
  const corner = calcSingleFoldCorner(start, end, foldSign, port)

  // v69：折线的内角点不能继续使用 createCylinderBetween 的双端外延，
  // 否则两段圆柱会在折角处互相穿过并露出“超出来”的尾巴。
  // 这里仅让线段在真正连接分子的一端嵌入，折角端不外延，由小球遮住拼接。
  const endpointOverlap = Math.max(0.08, radius * 1.05)
  group.add(createCylinderBetweenWithEndpointOverlap(start, corner, radius, color, opacity, additive, endpointOverlap, 0))
  group.add(createCylinderBetweenWithEndpointOverlap(corner, end, radius, color, opacity, additive, 0, endpointOverlap))

  if (!additive && port === '5') {
    const label5 = createTextSprite('5', '#dffbff', 38)
    label5.position.copy(corner.clone().add(new THREE.Vector3(0, foldSign >= 0 ? 0.26 : -0.26, 0.42)))
    label5.scale.set(0.72, 0.4, 1)
    label5.userData = { isBondCornerLabel: true }
    group.add(label5)
  }
  return group
}

function updateConnectedBonds(moved: THREE.Group) {
  for (const bond of bonds) {
    if (bond.a === moved || bond.b === moved) rebuildBondVisual(bond)
  }
  updatePhosphateTerminalStubs()
}

function hasBond(a: THREE.Group, b: THREE.Group) {
  return bonds.some((bond) => (bond.a === a && bond.b === b) || (bond.a === b && bond.b === a))
}

function selectMolecule(group: THREE.Group | null) {
  if (selectedGroup.value && selectedGroup.value !== group) selectedGroup.value.scale.setScalar(MOLECULE_SCALE)
  selectedGroup.value = group

  if (!group) {
    selectedInfo.value = null
    connectionStartGroup.value = null
    return
  }
  group.scale.setScalar(MOLECULE_SELECTED_SCALE)
  const data = getMoleculeData(group)
  selectedInfo.value = {
    id: data.id,
    name: data.name,
    detail: `${getSelectedDetail(data)}`,
  }
}

function getSelectedDetail(data: MoleculeData) {
  if (data.type === 'phosphate') return '磷酸基团：与脱氧核糖交替连接，构成 DNA 外侧骨架。'
  if (data.kind === 'sugar') return `${data.name}：DNA 中的五碳糖，可连接磷酸和碱基，用于体现 5’/3’ 方向性。`
  if (data.type === 'A') return '腺嘌呤 A：嘌呤双环，只与 T 配对，形成 2 个氢键。'
  if (data.type === 'T') return '胸腺嘧啶 T：嘧啶单环，只与 A 配对，形成 2 个氢键。'
  if (data.type === 'G') return '鸟嘌呤 G：嘌呤双环，只与 C 配对，形成 3 个氢键。'
  return '胞嘧啶 C：嘧啶单环，只与 G 配对，形成 3 个氢键。'
}

function flashMolecule(group: THREE.Group, color: number) {
  const original: Array<{ material: THREE.Material; emissive?: THREE.Color; color?: THREE.Color }> = []
  group.traverse((obj) => {
    const mesh = obj as THREE.Mesh
    const material = mesh.material as THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial | undefined
    if (material && 'emissive' in material) {
      original.push({ material, emissive: material.emissive?.clone(), color: material.color?.clone() })
      material.emissive?.setHex(color)
      if (material.color) material.color.setHex(color)
    }
  })
  window.setTimeout(() => {
    original.forEach((item) => {
      const mat = item.material as THREE.MeshStandardMaterial | THREE.MeshPhysicalMaterial
      if (item.emissive) mat.emissive.copy(item.emissive)
      if (item.color) mat.color.copy(item.color)
    })
  }, 450)
}


function registerFullStructureLayout(object: THREE.Group, plane: THREE.Vector3, helix: THREE.Vector3) {
  fullStructureLayoutEntries.push({
    object,
    plane: plane.clone(),
    helix: helix.clone(),
    planeRotationZ: object.rotation.z,
    helixRotationZ: object.rotation.z,
  })
}

function getHelixPoint(index: number, total: number, radius: number, height: number, phase = 0) {
  const t = total <= 1 ? 0 : index / (total - 1)
  const turns = 2.25
  const angle = Math.PI / 2 + phase + t * Math.PI * 2 * turns
  const y = (0.5 - t) * height
  return new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius)
}

function getHelixMidPoint(index: number, total: number, radius: number, height: number, phase = 0) {
  const t = (index + 0.5) / Math.max(1, total - 1)
  const turns = 2.25
  const angle = Math.PI / 2 + phase + t * Math.PI * 2 * turns
  const y = (0.5 - t) * height
  return new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius)
}


function getMedian(values: number[]) {
  if (!values.length) return 0
  const sorted = [...values].sort((a, b) => a - b)
  const mid = Math.floor(sorted.length / 2)
  return sorted.length % 2 ? sorted[mid] : (sorted[mid - 1] + sorted[mid]) / 2
}

function getBondedSugars(group: THREE.Group) {
  const result: THREE.Group[] = []
  bonds.forEach((bond) => {
    if (bond.a !== group && bond.b !== group) return
    const other = bond.a === group ? bond.b : bond.a
    if (getMoleculeData(other).kind === 'sugar') result.push(other)
  })
  return result
}

function getFirstBondedSugar(group: THREE.Group) {
  return getBondedSugars(group)[0] || null
}

function getSingleConnectedPhosphateIndexOffset(port: SugarBackbonePort, side: number) {
  // 单端磷酸的位置不能只看 3'/5'，还要看它属于上链还是下链。
  // 上链：5' 在左，3' 在右；下链反向平行：3' 在左，5' 在右。
  // v62：把单端 P 从糖旁边进一步拉开，避免与相邻“桥接 P”挤在一起。
  const offset = 1.05
  if (side >= 0) return port === '5' ? -offset : offset
  return port === '3' ? -offset : offset
}


type LayoutDraft = { plane: THREE.Vector3; helix: THREE.Vector3; planeRotationZ: number; helixRotationZ: number }

function resolvePhosphateLayoutCollisions(objectLayout: Map<THREE.Group, LayoutDraft>) {
  // v62：自建结构进入观察模式后，P 的位置由连接关系重新规整。
  // 如果一个单端 P 与相邻桥接 P 落在非常接近的槽位，会出现“两个 P 黏在一起”。
  // 这里只对磷酸基团做轻量碰撞分离，不改变糖、碱基和氢键的教学关系。
  const phosphateItems = [...objectLayout.entries()]
    .filter(([object]) => getMoleculeData(object).type === 'phosphate')
    .map(([object, layout]) => ({ object, layout }))

  const repel = (key: 'plane' | 'helix', minDistance: number) => {
    for (let iteration = 0; iteration < 8; iteration++) {
      let changed = false
      for (let i = 0; i < phosphateItems.length; i++) {
        for (let j = i + 1; j < phosphateItems.length; j++) {
          const a = phosphateItems[i].layout[key]
          const b = phosphateItems[j].layout[key]
          const delta = b.clone().sub(a)
          let distance = delta.length()
          if (distance >= minDistance) continue

          if (distance < 0.001) {
            // 完全重合时给一个稳定方向，避免 NaN。
            delta.set((j % 2 ? 1 : -1), key === 'plane' ? 0.35 : 0.2, key === 'helix' ? 0.35 : 0)
            distance = delta.length()
          }

          delta.normalize()
          const push = (minDistance - distance) / 2 + 0.08
          a.addScaledVector(delta, -push)
          b.addScaledVector(delta, push)
          changed = true
        }
      }
      if (!changed) break
    }
  }

  repel('plane', 3.35)
  repel('helix', 2.75)
}

function findNearestSugar(group: THREE.Group, sugars: THREE.Group[]) {
  if (!sugars.length) return null
  let nearest = sugars[0]
  let minDistance = Infinity
  sugars.forEach((sugar) => {
    const distance = sugar.position.distanceTo(group.position)
    if (distance < minDistance) {
      minDistance = distance
      nearest = sugar
    }
  })
  return nearest
}

function getPhosphateHelixIndex(phosphate: THREE.Group, sugarMeta: Map<THREE.Group, { index: number; side: number }>, fallbackIndex: number) {
  const connected = bonds
    .filter((bond) => bond.bondType === 'ester' && (bond.a === phosphate || bond.b === phosphate))
    .map((bond) => {
      const other = bond.a === phosphate ? bond.b : bond.a
      if (getMoleculeData(other).kind !== 'sugar') return null
      const meta = sugarMeta.get(other)
      if (!meta) return null
      const port = getSugarPhosphatePortForBond(bond, other)
      return { sugar: other, meta, port }
    })
    .filter(Boolean) as Array<{ sugar: THREE.Group; meta: { index: number; side: number }; port: SugarBackbonePort }>

  if (connected.length >= 2) {
    const index = connected.reduce((sum, item) => sum + item.meta.index, 0) / connected.length
    const side = connected.reduce((sum, item) => sum + item.meta.side, 0) >= 0 ? 1 : -1
    return { index, side }
  }

  if (connected.length === 1) {
    const item = connected[0]
    // 只有一个糖相连时，把 P 放到该糖的 5' 或 3' 外侧，尽量保留自建结构里的端点方向。
    const offset = getSingleConnectedPhosphateIndexOffset(item.port, item.meta.side)
    return { index: item.meta.index + offset, side: item.meta.side }
  }

  return { index: fallbackIndex, side: phosphate.position.y >= 0 ? 1 : -1 }
}

function getDistributedHelixSlot(index: number, count: number, totalSlots: number) {
  if (count <= 1) return (totalSlots - 1) / 2
  const padding = totalSlots >= 8 ? 1.15 : 0.65
  const usable = Math.max(1, totalSlots - 1 - padding * 2)
  return padding + (index / Math.max(1, count - 1)) * usable
}

function getCustomFormulaHelixPoint(centeredIndex: number, side: number, radius: number) {
  // v51：自建结构使用简化 B-DNA 螺旋公式，而不是把少量分子硬拉到长轨道两端。
  // 每相邻核苷酸约 36°，沿轴向按固定 rise 上升/下降。
  const stepAngle = THREE.MathUtils.degToRad(36)
  const rise = 3.6
  const phase = side >= 0 ? 0 : Math.PI
  const angle = Math.PI / 2 + phase + centeredIndex * stepAngle
  const y = -centeredIndex * rise
  return new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius)
}

function getSugarSideForCustomHelix(group: THREE.Group, yBase: number) {
  const data = getMoleculeData(group)
  if (data.type === 'sugar_reverse') return -1
  if (data.type === 'sugar') return 1
  return group.position.y >= yBase ? 1 : -1
}

function getSugarChainIndexMap(sugars: THREE.Group[]) {
  const map = new Map<THREE.Group, number>()
  const normal = sugars.filter((group) => getMoleculeData(group).type !== 'sugar_reverse').sort((a, b) => a.position.x - b.position.x)
  const reverse = sugars.filter((group) => getMoleculeData(group).type === 'sugar_reverse').sort((a, b) => a.position.x - b.position.x)

  const fill = (items: THREE.Group[]) => {
    const center = (items.length - 1) / 2
    items.forEach((group, index) => map.set(group, index - center))
  }

  fill(normal)
  fill(reverse)

  // 兜底：如果某些糖没有进入上面两组，按 X 坐标排布。
  sugars.forEach((group, index) => {
    if (!map.has(group)) map.set(group, index - (sugars.length - 1) / 2)
  })
  return map
}

function createCustomHelixLayoutFromCurrentScene() {
  fullStructureLayoutEntries = []
  if (!molecules.length) return false

  type PairLayoutItem = {
    topSugar: THREE.Group
    bottomSugar: THREE.Group
    topBase: THREE.Group
    bottomBase: THREE.Group
    sourceX: number
  }

  const getLinkedSugar = (base: THREE.Group) => getFirstBondedSugar(base)
  const getSugarSide = (sugar: THREE.Group) => getMoleculeData(sugar).type === 'sugar_reverse' ? -1 : 1

  const pairItems: PairLayoutItem[] = []
  bonds
    .filter((bond) => bond.bondType === 'hydrogen')
    .forEach((bond) => {
      const dataA = getMoleculeData(bond.a)
      const dataB = getMoleculeData(bond.b)
      if (dataA.kind !== 'base' || dataB.kind !== 'base') return

      const sugarA = getLinkedSugar(bond.a)
      const sugarB = getLinkedSugar(bond.b)
      if (!sugarA || !sugarB) return

      const sideA = getSugarSide(sugarA)
      const sideB = getSugarSide(sugarB)
      let topSugar = sugarA
      let bottomSugar = sugarB
      let topBase = bond.a
      let bottomBase = bond.b

      if (sideA < sideB || (sideA === sideB && sugarA.position.y < sugarB.position.y)) {
        topSugar = sugarB
        bottomSugar = sugarA
        topBase = bond.b
        bottomBase = bond.a
      }

      pairItems.push({
        topSugar,
        bottomSugar,
        topBase,
        bottomBase,
        sourceX: (topSugar.position.x + bottomSugar.position.x + topBase.position.x + bottomBase.position.x) / 4,
      })
    })

  pairItems.sort((a, b) => a.sourceX - b.sourceX)
  if (pairItems.length < 2) return false

  const totalPairs = pairItems.length
  const pairGap = 7.2
  const leftSugarX = -8.6
  const rightSugarX = 8.6
  const leftBaseX = -2.2
  const rightBaseX = 2.2
  const startY = ((totalPairs - 1) * pairGap) / 2

  const sugarMeta = new Map<THREE.Group, { pairIndex: number; side: number; plane: THREE.Vector3 }>()
  const objectLayout = new Map<THREE.Group, { plane: THREE.Vector3; helix: THREE.Vector3; planeRotationZ: number; helixRotationZ: number }>()

  const getCustomHelixPoint = (pairIndex: number, side: number, role: 'sugar' | 'base' | 'phosphate') => {
    // v64：自建结构进入观察/螺旋时，P 和脱氧核糖要明显分层，不能贴得太近。
    // 把双螺旋轴固定在 Y 轴，糖位于骨架中层，P 位于更外侧并沿链方向稍微前后错开，
    // 这样平面规整后再切螺旋，视觉会更像“竖着的双螺旋”，且 P 不会粘在糖旁边。
    const centered = pairIndex - (totalPairs - 1) / 2
    const angleStep = THREE.MathUtils.degToRad(totalPairs <= 3 ? 46 : 36)
    const phase = side >= 0 ? 0 : Math.PI
    const baseAngle = phase + centered * angleStep
    const rise = totalPairs <= 3 ? 7.8 : 4.35
    const baseY = -centered * rise

    if (role === 'base') {
      const radius = 2.8
      return new THREE.Vector3(Math.cos(baseAngle) * radius, baseY, Math.sin(baseAngle) * radius)
    }

    if (role === 'sugar') {
      const radius = 9.1
      return new THREE.Vector3(Math.cos(baseAngle) * radius, baseY, Math.sin(baseAngle) * radius)
    }

    const radius = 13.4
    const angle = baseAngle - side * 0.52
    const y = baseY + side * 0.15
    return new THREE.Vector3(Math.cos(angle) * radius, y, Math.sin(angle) * radius)
  }

  const addLayout = (object: THREE.Group, plane: THREE.Vector3, helix: THREE.Vector3, helixRotationZ = object.rotation.z) => {
    objectLayout.set(object, {
      plane: plane.clone(),
      helix: helix.clone(),
      planeRotationZ: object.rotation.z,
      helixRotationZ,
    })
  }

  pairItems.forEach((item, index) => {
    const y = startY - index * pairGap
    const topSugarPlane = new THREE.Vector3(leftSugarX, y, 0)
    const bottomSugarPlane = new THREE.Vector3(rightSugarX, y, 0)
    const topBasePlane = new THREE.Vector3(leftBaseX, y, 0)
    const bottomBasePlane = new THREE.Vector3(rightBaseX, y, 0)

    sugarMeta.set(item.topSugar, { pairIndex: index, side: 1, plane: topSugarPlane })
    sugarMeta.set(item.bottomSugar, { pairIndex: index, side: -1, plane: bottomSugarPlane })

    addLayout(item.topSugar, topSugarPlane, getCustomHelixPoint(index, 1, 'sugar'))
    addLayout(item.bottomSugar, bottomSugarPlane, getCustomHelixPoint(index, -1, 'sugar'))
    addLayout(item.topBase, topBasePlane, getCustomHelixPoint(index, 1, 'base'))
    addLayout(item.bottomBase, bottomBasePlane, getCustomHelixPoint(index, -1, 'base'))
  })

  // v76：自建结构进入观察模式时，P—糖骨架不能继续保留用户随手连出来的交叉关系。
  // 这里按“生成完整科学结构”的规则重新规整 P 的连接：
  // 左链：糖(i) 3' —— P —— 糖(i+1) 5'
  // 右链：糖(i) 5' —— P —— 糖(i+1) 3'
  // 多余 P 再作为两端游离磷酸。这样平面矫正不会出现黑线横穿碱基区的情况。
  const normalizePhosphateBondsToScientificTemplate = () => {
    const phosphates = molecules.filter((group) => getMoleculeData(group).type === 'phosphate')
    if (!phosphates.length) return

    type PhosphateSlot =
      | { kind: 'bridge'; side: 1 | -1; leftSugar: THREE.Group; rightSugar: THREE.Group; index: number }
      | { kind: 'terminal'; side: 1 | -1; sugar: THREE.Group; port: SugarBackbonePort; beforeSugar: boolean; index: number }

    const slots: PhosphateSlot[] = []

    for (let i = 0; i < pairItems.length - 1; i++) {
      slots.push({ kind: 'bridge', side: 1, leftSugar: pairItems[i].topSugar, rightSugar: pairItems[i + 1].topSugar, index: i + 0.5 })
      slots.push({ kind: 'bridge', side: -1, leftSugar: pairItems[i].bottomSugar, rightSugar: pairItems[i + 1].bottomSugar, index: i + 0.5 })
    }

    const last = pairItems.length - 1
    const terminalSlots: PhosphateSlot[] = [
      { kind: 'terminal', side: 1, sugar: pairItems[0].topSugar, port: '5', beforeSugar: true, index: -0.95 },
      { kind: 'terminal', side: -1, sugar: pairItems[last].bottomSugar, port: '5', beforeSugar: false, index: last + 0.95 },
      { kind: 'terminal', side: 1, sugar: pairItems[last].topSugar, port: '3', beforeSugar: false, index: last + 0.95 },
      { kind: 'terminal', side: -1, sugar: pairItems[0].bottomSugar, port: '3', beforeSugar: true, index: -0.95 },
    ]
    slots.push(...terminalSlots)

    const sortedPhosphates = [...phosphates].sort((a, b) => {
      // 尽量保持用户摆放的大致上下顺序；如果位置接近，再按创建顺序兜底。
      const dy = b.position.y - a.position.y
      if (Math.abs(dy) > 0.1) return dy
      return molecules.indexOf(a) - molecules.indexOf(b)
    })

    bonds.filter((bond) => bond.bondType === 'ester').slice().forEach((bond) => removeBond(bond))

    sortedPhosphates.slice(0, slots.length).forEach((phosphate, index) => {
      const slot = slots[index]
      if (slot.kind === 'bridge') {
        if (slot.side === 1) {
          createBond(slot.leftSugar, phosphate, connectionRules['sugar-phosphate'], { silent: true, sugarPort: '3' })
          createBond(phosphate, slot.rightSugar, connectionRules['phosphate-sugar'], { silent: true, sugarPort: '5' })
        } else {
          createBond(slot.leftSugar, phosphate, connectionRules['sugar-phosphate'], { silent: true, sugarPort: '5' })
          createBond(phosphate, slot.rightSugar, connectionRules['phosphate-sugar'], { silent: true, sugarPort: '3' })
        }
        return
      }

      if (slot.beforeSugar) createBond(phosphate, slot.sugar, connectionRules['phosphate-sugar'], { silent: true, sugarPort: slot.port })
      else createBond(slot.sugar, phosphate, connectionRules['sugar-phosphate'], { silent: true, sugarPort: slot.port })
    })
  }

  normalizePhosphateBondsToScientificTemplate()

  const findPairIndexForSugar = (sugar: THREE.Group) => sugarMeta.get(sugar)

  molecules.forEach((group) => {
    if (objectLayout.has(group)) return
    const data = getMoleculeData(group)

    if (data.type === 'phosphate') {
      const connectedSugarItems = bonds
        .filter((bond) => bond.bondType === 'ester' && (bond.a === group || bond.b === group))
        .map((bond) => {
          const other = bond.a === group ? bond.b : bond.a
          if (getMoleculeData(other).kind !== 'sugar') return null
          const meta = findPairIndexForSugar(other)
          if (!meta) return null
          const port = getSugarPhosphatePortForBond(bond, other)
          return { sugar: other, meta, port }
        })
        .filter(Boolean) as Array<{ sugar: THREE.Group; meta: { pairIndex: number; side: number; plane: THREE.Vector3 }; port: SugarBackbonePort }>

      if (connectedSugarItems.length) {
        const avgIndex = connectedSugarItems.reduce((sum, item) => sum + item.meta.pairIndex, 0) / connectedSugarItems.length
        const side = connectedSugarItems.reduce((sum, item) => sum + item.meta.side, 0) >= 0 ? 1 : -1
        const first = connectedSugarItems[0]
        const portOffset = getSingleConnectedPhosphateIndexOffset(first.port, first.meta.side)
        const planeY = startY - (connectedSugarItems.length >= 2 ? avgIndex : avgIndex + portOffset) * pairGap
        const planeX = side > 0 ? leftSugarX - 2.9 : rightSugarX + 2.9
        const helixIndex = connectedSugarItems.length >= 2 ? avgIndex : avgIndex + portOffset
        addLayout(group, new THREE.Vector3(planeX, planeY, 0), getCustomHelixPoint(helixIndex, side, 'phosphate'))
        return
      }
    }

    if (data.kind === 'base') {
      const sugar = getLinkedSugar(group)
      const meta = sugar ? findPairIndexForSugar(sugar) : null
      if (meta) {
        const x = meta.side > 0 ? leftBaseX : rightBaseX
        const y = startY - meta.pairIndex * pairGap
        addLayout(group, new THREE.Vector3(x, y, 0), getCustomHelixPoint(meta.pairIndex, meta.side, 'base'))
        return
      }
    }

    if (data.kind === 'sugar') {
      const fallbackIndex = objectLayout.size - (molecules.length - 1) / 2
      const side = getSugarSide(group)
      addLayout(group, new THREE.Vector3(side > 0 ? leftSugarX : rightSugarX, startY - fallbackIndex * pairGap, 0), getCustomHelixPoint(fallbackIndex, side, 'sugar'))
      return
    }

    const fallbackIndex = objectLayout.size - (molecules.length - 1) / 2
    addLayout(group, new THREE.Vector3(group.position.x <= 0 ? leftBaseX : rightBaseX, startY - fallbackIndex * pairGap, 0), getCustomHelixPoint(fallbackIndex, group.position.x <= 0 ? 1 : -1, 'base'))
  })

  // v62：注册前先对 P 做碰撞分离，避免自建结构进入观察/螺旋后两个 P 黏在一起。
  resolvePhosphateLayoutCollisions(objectLayout)

  // 重新注册布局。平面模式会先规整成教材中的梯形 / 双链结构，再由同一套 pairIndex 切换到螺旋。
  objectLayout.forEach((layout, object) => {
    fullStructureLayoutEntries.push({
      object,
      plane: layout.plane,
      helix: layout.helix,
      planeRotationZ: layout.planeRotationZ,
      helixRotationZ: layout.helixRotationZ,
    })
  })

  hintText.value = '已将自建结构规整为竖版教材式平面 DNA；切换螺旋时会按碱基对序号生成更清晰的教学双螺旋。'
  return true
}

function rebuildAllBondVisuals() {
  bonds.forEach((bond) => rebuildBondVisual(bond))
}

function isCustomStructureReadyForHelix() {
  const sugarCount = molecules.filter((group) => getMoleculeData(group).kind === 'sugar').length
  const phosphateCount = molecules.filter((group) => getMoleculeData(group).type === 'phosphate').length
  const pairCount = bonds.filter((bond) => bond.bondType === 'hydrogen').length

  // v53：不能把很少的自建零件硬掰成双螺旋，那样线会乱飞、结构也不像 DNA。
  // 至少要有两条链的雏形和碱基配对，才允许把自建结构公式化为螺旋。
  return sugarCount >= 4 && phosphateCount >= 4 && pairCount >= 2
}

function toggleStructureViewMode() {
  if (currentMode.value !== 'view') return
  const targetMode: StructureViewMode = structureViewMode.value === 'helix' ? 'plane' : 'helix'

  if (targetMode === 'helix' && !fullStructureLayoutEntries.length && molecules.length > 0) {
    if (!isCustomStructureReadyForHelix()) {
      ElMessage.warning('当前自建结构还不完整，不能强行切成双螺旋。请继续构建两条链和至少 2 组碱基配对，或点击“生成完整 DNA 结构”。')
      return
    }
    createCustomHelixLayoutFromCurrentScene()
  } else if (!fullStructureLayoutEntries.length) {
    loadPresetDnaStructure()
  }

  animateFullStructureToMode(targetMode)
}


function getObservationCameraPose(targetMode: StructureViewMode) {
  // v58：螺旋模式不要从上方俯视。DNA 螺旋轴在 Y 轴方向，
  // 摄像机保持 y≈0 从侧前方观察，屏幕上才会像“竖起来的双螺旋”，
  // 不会再有被放倒后平视/俯视的感觉。
  if (targetMode === 'helix') {
    return {
      // v62：螺旋模式使用正前方直视竖轴。模型本身沿 Y 轴竖起来，
      // 摄像机不再从过高/过偏的位置看，避免出现“倒下来的 DNA”观感。
      position: new THREE.Vector3(22, 2, 80),
      target: new THREE.Vector3(0, 0, 0),
    }
  }
  return {
    position: new THREE.Vector3(0, 0, 64),
    target: new THREE.Vector3(0, 0, 0),
  }
}

function animateCameraForStructureMode(targetMode: StructureViewMode, options: { silent?: boolean } = {}) {
  const camera = cameraRef.value
  const controls = controlsRef.value
  if (!camera || !controls) return

  cancelAnimationFrame(cameraTransitionFrame)
  const pose = getObservationCameraPose(targetMode)

  if (options.silent) {
    camera.position.copy(pose.position)
    camera.lookAt(pose.target)
    controls.target.copy(pose.target)
    controls.update()
    return
  }

  const start = performance.now()
  const duration = 720
  const fromPosition = camera.position.clone()
  const fromTarget = controls.target.clone()
  const ease = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

  const tick = (now: number) => {
    const progress = Math.min(1, (now - start) / duration)
    const k = ease(progress)
    camera.position.copy(fromPosition).lerp(pose.position, k)
    controls.target.copy(fromTarget).lerp(pose.target, k)
    camera.lookAt(controls.target)
    controls.update()

    if (progress < 1) {
      cameraTransitionFrame = requestAnimationFrame(tick)
    }
  }

  cameraTransitionFrame = requestAnimationFrame(tick)
}

function animateFullStructureToMode(targetMode: StructureViewMode, options: { silent?: boolean } = {}) {
  if (!fullStructureLayoutEntries.length) {
    structureViewMode.value = targetMode
    return
  }

  cancelAnimationFrame(fullStructureAnimationFrame)
  animateCameraForStructureMode(targetMode, options)
  isStructureAnimating.value = true
  const start = performance.now()
  const duration = options.silent ? 180 : 720
  const startPositions = fullStructureLayoutEntries.map((entry) => entry.object.position.clone())
  const startRotations = fullStructureLayoutEntries.map((entry) => entry.object.rotation.z)
  const ease = (t: number) => t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2

  const tick = (now: number) => {
    const progress = Math.min(1, (now - start) / duration)
    const k = ease(progress)

    fullStructureLayoutEntries.forEach((entry, index) => {
      const target = targetMode === 'helix' ? entry.helix : entry.plane
      const targetRot = targetMode === 'helix' ? entry.helixRotationZ : entry.planeRotationZ
      entry.object.position.copy(startPositions[index]).lerp(target, k)
      entry.object.rotation.z = THREE.MathUtils.lerp(startRotations[index], targetRot, k)
    })
    rebuildAllBondVisuals()

    if (progress < 1) {
      fullStructureAnimationFrame = requestAnimationFrame(tick)
      return
    }

    structureViewMode.value = targetMode
    isStructureAnimating.value = false
    hintText.value = targetMode === 'helix'
      ? '已切换为螺旋模式：现在可以导出 OBJ / STL 模型。'
      : '已切换为平面模式：适合课堂讲解碱基互补配对。'
    if (!options.silent) ElMessage.success(targetMode === 'helix' ? '已切换为螺旋模式' : '已切换为平面模式')
  }

  fullStructureAnimationFrame = requestAnimationFrame(tick)
}

function ensureModelExportAllowed() {
  if (canExportModel.value) return true
  if (currentMode.value !== 'view') {
    ElMessage.warning('构建模式和练习模式只支持场景截图；请进入观察模式并切换为螺旋模式后再导出模型。')
    return false
  }
  ElMessage.warning('当前还是平面观察，请先点击“切换螺旋”，再导出 OBJ / STL 模型。')
  return false
}

function loadPresetDnaStructure() {
  clearScene(false)
  fullStructureLayoutEntries = []
  structureViewMode.value = 'plane'
  currentMode.value = 'view'
  const controls = controlsRef.value
  if (controls) {
    controls.enabled = true
    controls.enableRotate = true
    controls.enablePan = true
    controls.enableZoom = true
  }

  // v34：观察模式默认生成平面 DNA；点击“切换螺旋”后通过动画切换为螺旋模型，模型导出只允许在螺旋模式下进行。
  // v47：完整结构拉开间距，避免糖、P、碱基和骨架折线挤在一起；同时保留足够碱基对让螺旋看起来像双螺旋。
  const seq: Array<'A' | 'T' | 'G' | 'C'> = ['A', 'G', 'T', 'C', 'A', 'G', 'T', 'C', 'G', 'A']
  const pairMap: Record<'A' | 'T' | 'G' | 'C', 'A' | 'T' | 'G' | 'C'> = { A: 'T', T: 'A', G: 'C', C: 'G' }
  const gap = 5.2
  const leftSugarX = -9.0
  const rightSugarX = 9.0
  const leftBaseX = -2.8
  const rightBaseX = 2.8
  const startY = ((seq.length - 1) * gap) / 2
  const helixHeight = 36
  const sugarRadius = 8.45
  const phosphateRadius = 9.6
  const baseRadius = 2.65
  const backboneOffsetY = 1.18

  const topSugars: THREE.Group[] = []
  const bottomSugars: THREE.Group[] = []

  seq.forEach((base, index) => {
    const y = startY - index * gap
    const pair = pairMap[base]
    const planeTopSugar = new THREE.Vector3(leftSugarX, y, 0)
    const planeBottomSugar = new THREE.Vector3(rightSugarX, y, 0)
    const planeTopBase = new THREE.Vector3(leftBaseX, y, 0)
    const planeBottomBase = new THREE.Vector3(rightBaseX, y, 0)

    const helixTopSugar = getHelixPoint(index, seq.length, sugarRadius, helixHeight, 0)
    const helixBottomSugar = getHelixPoint(index, seq.length, sugarRadius, helixHeight, Math.PI)
    const helixTopBase = getHelixPoint(index, seq.length, baseRadius, helixHeight, 0)
    const helixBottomBase = getHelixPoint(index, seq.length, baseRadius, helixHeight, Math.PI)

    const topSugar = createMolecule('sugar', planeTopSugar, { silent: true })!
    const bottomSugar = createMolecule('sugar_reverse', planeBottomSugar, { silent: true })!
    topSugars.push(topSugar)
    bottomSugars.push(bottomSugar)
    registerFullStructureLayout(topSugar, planeTopSugar, helixTopSugar)
    registerFullStructureLayout(bottomSugar, planeBottomSugar, helixBottomSugar)

    const topBase = createMolecule(base, planeTopBase, { silent: true })!
    const bottomBase = createMolecule(pair, planeBottomBase, { silent: true })!
    registerFullStructureLayout(topBase, planeTopBase, helixTopBase)
    registerFullStructureLayout(bottomBase, planeBottomBase, helixBottomBase)

    createBond(topSugar, topBase, connectionRules[`sugar-${base}`], { silent: true })
    createBond(bottomSugar, bottomBase, connectionRules[`sugar-${pair}`], { silent: true })
    createBond(topBase, bottomBase, connectionRules[`${base}-${pair}`], { silent: true })
  })

  for (let i = 0; i < seq.length - 1; i++) {
    const midY = startY - i * gap - gap / 2
    const topPlane = new THREE.Vector3(leftSugarX - 3.0, midY, 0)
    const bottomPlane = new THREE.Vector3(rightSugarX + 3.0, midY, 0)
    const topHelix = getHelixMidPoint(i, seq.length, phosphateRadius, helixHeight, 0)
    const bottomHelix = getHelixMidPoint(i, seq.length, phosphateRadius, helixHeight, Math.PI)

    const topP = createMolecule('phosphate', topPlane, { silent: true })!
    registerFullStructureLayout(topP, topPlane, topHelix)
    createBond(topSugars[i], topP, connectionRules['sugar-phosphate'], { silent: true, sugarPort: '3' })
    createBond(topP, topSugars[i + 1], connectionRules['phosphate-sugar'], { silent: true, sugarPort: '5' })

    const bottomP = createMolecule('phosphate', bottomPlane, { silent: true })!
    registerFullStructureLayout(bottomP, bottomPlane, bottomHelix)
    createBond(bottomSugars[i], bottomP, connectionRules['sugar-phosphate'], { silent: true, sugarPort: '5' })
    createBond(bottomP, bottomSugars[i + 1], connectionRules['phosphate-sugar'], { silent: true, sugarPort: '3' })
  }

  const terminalOffset = gap * 0.55
  const terminalPlaneAndHelix = [
    { plane: new THREE.Vector3(leftSugarX - 3.0, startY + terminalOffset, 0), helix: getHelixMidPoint(-1, seq.length, phosphateRadius, helixHeight, 0), sugar: topSugars[0], rule: connectionRules['phosphate-sugar'], beforeSugar: true, sugarPort: '5' as SugarBackbonePort },
    { plane: new THREE.Vector3(leftSugarX - 3.0, -startY - terminalOffset, 0), helix: getHelixMidPoint(seq.length - 1, seq.length, phosphateRadius, helixHeight, 0), sugar: topSugars[topSugars.length - 1], rule: connectionRules['sugar-phosphate'], beforeSugar: false, sugarPort: '3' as SugarBackbonePort },
    { plane: new THREE.Vector3(rightSugarX + 3.0, startY + terminalOffset, 0), helix: getHelixMidPoint(-1, seq.length, phosphateRadius, helixHeight, Math.PI), sugar: bottomSugars[0], rule: connectionRules['phosphate-sugar'], beforeSugar: true, sugarPort: '3' as SugarBackbonePort },
    { plane: new THREE.Vector3(rightSugarX + 3.0, -startY - terminalOffset, 0), helix: getHelixMidPoint(seq.length - 1, seq.length, phosphateRadius, helixHeight, Math.PI), sugar: bottomSugars[bottomSugars.length - 1], rule: connectionRules['sugar-phosphate'], beforeSugar: false, sugarPort: '5' as SugarBackbonePort },
  ]

  terminalPlaneAndHelix.forEach((item) => {
    const p = createMolecule('phosphate', item.plane, { silent: true })!
    registerFullStructureLayout(p, item.plane, item.helix)
    if (item.beforeSugar) createBond(p, item.sugar, item.rule, { silent: true, sugarPort: item.sugarPort })
    else createBond(item.sugar, p, item.rule, { silent: true, sugarPort: item.sugarPort })
  })

  // v59：生成完整结构后，也走一遍“观察模式规整”的同一套布局算法。
  // 之前首次点击“生成完整 DNA 结构”使用的是 preset 自己注册的 helix 点；
  // 再切构建 -> 观察时又会被 createCustomHelixLayoutFromCurrentScene() 重排，
  // 所以首次螺旋和二次进入观察后的螺旋不一致。这里统一为同一套布局。
  if (createCustomHelixLayoutFromCurrentScene()) {
    fullStructureLayoutEntries.forEach((entry) => {
      entry.object.position.copy(entry.plane)
      entry.object.rotation.z = entry.planeRotationZ
    })
    structureViewMode.value = 'plane'
    rebuildAllBondVisuals()
  }

  const root = rootGroupRef.value
  if (root) root.rotation.set(0, 0, 0)
  resetCamera()
  updateStats()
  hintText.value = '已生成完整 DNA 结构：已统一使用观察模式规整布局；切换螺旋时会保持真实双螺旋效果。'
  ElMessage.success('已生成完整 DNA 结构')
}

function ensureQuizStarted() {
  if (!quizQuestions.length) return
}

function openQuizDialog() {
  quizDialogVisible.value = true
}

function restartQuiz() {
  quizQuestions.forEach((question) => {
    delete quizAnswers[question.id]
  })
  quizSubmitted.value = false
}

function submitQuiz() {
  if (!isQuizComplete.value) {
    ElMessage.warning('请先完成所有题目，再提交测验。')
    return
  }
  quizSubmitted.value = true
}

function getQuizOptionClass(question: QuizQuestion, value: string) {
  if (!quizSubmitted.value) return ''
  if (value === question.answer) return 'is-correct'
  if (quizAnswers[question.id] === value && value !== question.answer) return 'is-wrong'
  return ''
}

function checkQuizAnswer() {
  const task = currentQuiz.value
  let correct = false

  if (task.checkType === 'atPair') correct = hasPair('A', 'T')
  if (task.checkType === 'gcPair') correct = hasPair('G', 'C')
  if (task.checkType === 'anyPair') correct = stats.validPairCount > 0
  if (task.checkType === 'nucleotide') correct = hasNucleotideStructure()

  quizResult.value = { correct, message: correct ? task.success : task.fail }
  if (correct) ElMessage.success(task.success)
  else ElMessage.warning(task.fail)
}

function hasPair(a: string, b: string) {
  return bonds.some((bond) => {
    if (bond.bondType !== 'hydrogen') return false
    const ka = getConnectionKey(bond.a)
    const kb = getConnectionKey(bond.b)
    return (ka === a && kb === b) || (ka === b && kb === a)
  })
}

function hasNucleotideStructure() {
  return molecules.some((mol) => {
    const data = getMoleculeData(mol)
    if (data.kind !== 'sugar') return false
    const linked = bonds.filter((bond) => bond.a === mol || bond.b === mol).map((bond) => (bond.a === mol ? bond.b : bond.a))
    const hasP = linked.some((item) => getMoleculeData(item).type === 'phosphate')
    const hasBase = linked.some((item) => getMoleculeData(item).kind === 'base')
    return hasP && hasBase
  })
}

function prevQuiz() {
  quizIndex.value = Math.max(0, quizIndex.value - 1)
  quizResult.value = null
  hintText.value = currentQuiz.value.description
}

function nextQuiz() {
  quizIndex.value = Math.min(quizTasks.length - 1, quizIndex.value + 1)
  quizResult.value = null
  hintText.value = currentQuiz.value.description
}


function getExportTimeText() {
  const now = new Date()
  const pad = (value: number) => `${value}`.padStart(2, '0')
  return `${now.getFullYear()}${pad(now.getMonth() + 1)}${pad(now.getDate())}_${pad(now.getHours())}${pad(now.getMinutes())}${pad(now.getSeconds())}`
}

function downloadBlob(blob: Blob, filename: string) {
  const url = URL.createObjectURL(blob)
  const link = document.createElement('a')
  link.href = url
  link.download = filename
  document.body.appendChild(link)
  link.click()
  link.remove()
  URL.revokeObjectURL(url)
}

function captureScene() {
  const renderer = rendererRef.value
  const composer = composerRef.value
  const scene = sceneRef.value
  const camera = cameraRef.value
  if (!renderer || !scene || !camera) return

  controlsRef.value?.update()
  if (composer) composer.render()
  else renderer.render(scene, camera)

  renderer.domElement.toBlob((blob) => {
    if (!blob) {
      ElMessage.error('截图失败，请稍后重试。')
      return
    }
    downloadBlob(blob, `DNA_场景截图_${getExportTimeText()}.png`)
    ElMessage.success('已导出场景截图')
  }, 'image/png')
}

function exportSceneGlb() {
  if (!ensureModelExportAllowed()) return
  const root = rootGroupRef.value
  if (!root || molecules.length === 0) {
    ElMessage.warning('当前场景没有可导出的分子结构。')
    return
  }

  clearSelection()
  const exporter = new GLTFExporter()
  exporter.parse(
    root,
    (result) => {
      if (result instanceof ArrayBuffer) {
        downloadBlob(new Blob([result], { type: 'model/gltf-binary' }), `DNA_分子结构_${getExportTimeText()}.glb`)
        ElMessage.success('已导出 GLB 模型')
        return
      }

      const json = JSON.stringify(result, null, 2)
      downloadBlob(new Blob([json], { type: 'model/gltf+json' }), `DNA_分子结构_${getExportTimeText()}.gltf`)
      ElMessage.success('已导出 GLTF 模型')
    },
    (error) => {
      console.error(error)
      ElMessage.error('导出 GLB 失败，请检查当前模型。')
    },
    {
      binary: true,
      onlyVisible: true,
      truncateDrawRange: true,
    },
  )
}


function exportSceneObj() {
  if (!ensureModelExportAllowed()) return
  const root = rootGroupRef.value
  if (!root || molecules.length === 0) {
    ElMessage.warning('当前场景没有可导出的分子结构。')
    return
  }

  clearSelection()

  try {
    const exportRoot = root.clone(true)
    exportRoot.traverse((object) => {
      object.userData = {}
    })

    const exporter = new OBJExporter()
    const objText = exporter.parse(exportRoot)
    downloadBlob(new Blob([objText], { type: 'text/plain;charset=utf-8' }), `DNA_分子结构_${getExportTimeText()}.obj`)
    ElMessage.success('已导出 OBJ 模型')
  } catch (error) {
    console.error(error)
    ElMessage.error('导出 OBJ 失败，请检查当前模型。')
  }
}

function getCleanExportRoot() {
  const root = rootGroupRef.value
  if (!root || molecules.length === 0) {
    ElMessage.warning('当前场景没有可导出的分子结构。')
    return null
  }

  clearSelection()
  const exportRoot = root.clone(true)
  exportRoot.traverse((object) => {
    object.userData = {}
  })
  return exportRoot
}

function exportSceneStlAscii() {
  if (!ensureModelExportAllowed()) return
  const exportRoot = getCleanExportRoot()
  if (!exportRoot) return

  try {
    const exporter = new STLExporter()
    const stlResult = exporter.parse(exportRoot, { binary: false })
    const stlText = typeof stlResult === 'string' ? stlResult : new TextDecoder().decode(stlResult)
    downloadBlob(new Blob([stlText], { type: 'model/stl;charset=utf-8' }), `DNA_分子结构_${getExportTimeText()}.stl`)
    ElMessage.success('已导出 STL 模型')
  } catch (error) {
    console.error(error)
    ElMessage.error('导出 STL 失败，请检查当前模型。')
  }
}

function refreshCanvasAfterLayout() {
  nextTick(() => {
    onWindowResize()
    window.setTimeout(onWindowResize, 260)
  })
}

function toggleLeftPanel() {
  isLeftPanelCollapsed.value = !isLeftPanelCollapsed.value
  hintText.value = isLeftPanelCollapsed.value ? '已收起左侧分子组件库，主场景空间更大。' : '已展开左侧分子组件库。'
  refreshCanvasAfterLayout()
}

function toggleRightPanel() {
  isRightPanelCollapsed.value = !isRightPanelCollapsed.value
  hintText.value = isRightPanelCollapsed.value ? '已收起右侧知识点面板，主场景空间更大。' : '已展开右侧知识点面板。'
  refreshCanvasAfterLayout()
}


async function toggleFullscreen() {
  const target = pageRef.value || document.documentElement
  try {
    if (!document.fullscreenElement) {
      await target.requestFullscreen()
    } else {
      await document.exitFullscreen()
    }
  } catch (error) {
    console.error(error)
    ElMessage.warning('当前浏览器暂不支持或阻止了全屏操作。')
  }
}

function handleFullscreenChange() {
  isFullscreen.value = document.fullscreenElement === pageRef.value || document.fullscreenElement === document.documentElement
  hintText.value = isFullscreen.value ? '已进入全屏展示模式。' : '已退出全屏展示模式。'
  refreshCanvasAfterLayout()
}

function setOrbitAutoRotate(enabled: boolean, options: { silent?: boolean } = {}) {
  isAutoRotating.value = enabled
  const controls = controlsRef.value
  if (controls) {
    controls.autoRotate = enabled
    controls.autoRotateSpeed = 1.25
  }
  if (!options.silent) {
    hintText.value = enabled
      ? '已开启自动旋转：使用 OrbitControls 绕模型观察，模型自身坐标不变。'
      : '已停止自动旋转。'
  }
}

function toggleAutoRotate() {
  setOrbitAutoRotate(!isAutoRotating.value)
}

function resetCamera() {
  const camera = cameraRef.value
  const controls = controlsRef.value
  const root = rootGroupRef.value
  if (!camera) return
  if (currentMode.value === 'view' && structureViewMode.value === 'helix') {
    const pose = getObservationCameraPose('helix')
    camera.position.copy(pose.position)
    controls?.target.copy(pose.target)
  } else if (currentMode.value === 'view') {
    const pose = getObservationCameraPose('plane')
    camera.position.copy(pose.position)
    controls?.target.copy(pose.target)
  } else {
    camera.position.set(0, 0, 42)
    controls?.target.set(0, 0, 0)
  }
  camera.lookAt(controls?.target ?? new THREE.Vector3(0, 0, 0))
  if (root) root.rotation.set(0, 0, 0)
  controls?.update()
}

function clearSelection() {
  selectMolecule(null)
  hintText.value = '已取消选中。'
}

function focusSelected() {
  const selected = selectedGroup.value
  const controls = controlsRef.value
  const camera = cameraRef.value
  if (!selected || !camera || !controls) return
  controls.target.copy(selected.position)
  camera.position.copy(selected.position.clone().add(new THREE.Vector3(0, 0, 20)))
  controls.update()
  hintText.value = `已聚焦：${getMoleculeData(selected).name}`
}

function disconnectSelected() {
  const selected = selectedGroup.value
  if (!selected) return

  const related = bonds.filter((bond) => bond.a === selected || bond.b === selected)
  if (!related.length) {
    hintText.value = '当前选中分子还没有建立连接。'
    ElMessage.info('当前选中分子没有连接')
    return
  }

  related.forEach((bond) => removeBond(bond))
  updateStats()
  const data = getMoleculeData(selected)
  hintText.value = `已取消 ${data.shortName} 的 ${related.length} 个连接，可以拖动分子后重新双击连接。`
  ElMessage.success(`已取消 ${related.length} 个连接`)
}

function deleteSelected() {
  const selected = selectedGroup.value
  if (!selected) return
  removeMolecule(selected)
  selectMolecule(null)
  updateStats()
  hintText.value = '已删除选中分子及其相关连接。'
}

function clearSceneWithConfirm() {
  ElMessageBox.confirm('确定要清空当前构建的所有分子和连接吗？', '清空画布', {
    confirmButtonText: '清空',
    cancelButtonText: '取消',
    type: 'warning',
  }).then(() => clearScene(true)).catch(() => undefined)
}

function clearScene(showMessage = true) {
  const root = rootGroupRef.value
  if (!root) return
  disposeObjectChildren(root)
  root.clear()
  const terminalStubs = new THREE.Group()
  terminalStubs.name = 'DNA_TERMINAL_PHOSPHATE_STUBS'
  root.add(terminalStubs)
  terminalStubGroupRef.value = terminalStubs
  molecules = []
  bonds = []
  fullStructureLayoutEntries = []
  cancelAnimationFrame(fullStructureAnimationFrame)
  isStructureAnimating.value = false
  if (showMessage) structureViewMode.value = 'plane'
  selectedGroup.value = null
  selectedInfo.value = null
  connectionStartGroup.value = null
  updateStats()
  if (showMessage) {
    hintText.value = '画布已清空。可以重新拖入分子开始构建；按住分子拖动位置，双击两个分子建立连接。'
    ElMessage.success('已清空画布')
  }
}

function removeMolecule(target: THREE.Group) {
  const root = rootGroupRef.value
  const related = bonds.filter((bond) => bond.a === target || bond.b === target)
  related.forEach((bond) => removeBond(bond))
  molecules = molecules.filter((item) => item !== target)
  disposeObjectChildren(target)
  root?.remove(target)
  updatePhosphateTerminalStubs()
}

function removeBond(target: BondData) {
  const root = rootGroupRef.value

  // v9 修复：取消连接时，除了移除 Three.js 里的连接对象，也要同步清理两端分子 userData.connections。
  // 否则 UI 看起来删了线，但数据层仍认为两端存在连接，后续重新吸附 / 练习判断就会异常。
  const aData = getMoleculeData(target.a)
  const bData = getMoleculeData(target.b)
  aData.connections = aData.connections.filter((id) => id !== target.id)
  bData.connections = bData.connections.filter((id) => id !== target.id)

  bonds = bonds.filter((bond) => bond !== target)
  disposeObjectChildren(target.group)
  root?.remove(target.group)
  updatePhosphateTerminalStubs()
  updateSugarDefaultFoldVisibility()
}


function ensureTerminalStubGroup() {
  const root = rootGroupRef.value
  if (!root) return null
  let group = terminalStubGroupRef.value
  if (!group || group.parent !== root) {
    group = new THREE.Group()
    group.name = 'DNA_TERMINAL_PHOSPHATE_STUBS'
    root.add(group)
    terminalStubGroupRef.value = group
  }
  return group
}


function updateSugarDefaultFoldVisibility() {
  molecules.forEach((molecule) => {
    const data = getMoleculeData(molecule)
    if (data.kind !== 'sugar') return
    const occupied = getOccupiedSugarBackbonePorts(molecule)
    const fold = molecule.children.find((child) => child.name === 'SugarDefaultFiveFold')
    if (fold) fold.visible = !occupied.has('5')
  })
}

function updatePhosphateTerminalStubs() {
  // v29：去掉“P 只有一端连接时自动展示的半截骨架折线”。
  // 保留函数作为统一清理入口，避免旧版本残留的末端折线继续显示。
  const stubGroup = terminalStubGroupRef.value
  if (!stubGroup) return
  disposeObjectChildren(stubGroup)
  stubGroup.clear()
}


function updateStats() {
  stats.moleculeCount = molecules.length
  stats.baseCount = molecules.filter((item) => getMoleculeData(item).kind === 'base').length
  stats.covalentCount = bonds.filter((bond) => bond.bondType === 'ester' || bond.bondType === 'glycosidic').length
  stats.hydrogenBondCount = bonds.filter((bond) => bond.bondType === 'hydrogen').length
  stats.validPairCount = stats.hydrogenBondCount
  stats.buildProgress = Math.min(100, Math.round(stats.covalentCount * 8 + stats.moleculeCount * 3))
  stats.pairProgress = Math.min(100, Math.round(stats.validPairCount * 34))
}

function disposeObjectChildren(object: THREE.Object3D) {
  object.traverse((child) => {
    const mesh = child as THREE.Mesh
    if (mesh.geometry) mesh.geometry.dispose()

    const material = mesh.material as THREE.Material | THREE.Material[] | undefined
    if (Array.isArray(material)) {
      material.forEach(disposeMaterial)
    } else if (material) {
      disposeMaterial(material)
    }
  })
}

function disposeMaterial(material: THREE.Material) {
  const maybeWithMap = material as THREE.Material & { map?: THREE.Texture }
  if (maybeWithMap.map) maybeWithMap.map.dispose()
  material.dispose()
}

function isMoleculeType(value: string): value is MoleculeType {
  return ['sugar', 'sugar_reverse', 'phosphate', 'A', 'T', 'G', 'C'].includes(value)
}

function getPalette(type: MoleculeType) {
  return moleculePalette.find((item) => item.type === type) || moleculePalette[0]
}

function getMoleculeData(group: THREE.Group) {
  return group.userData as MoleculeData
}
</script>

<style scoped>
.dna-lab-page {
  width: 100%;
  height: 100vh;
  min-height: 720px;
  overflow: hidden;
  padding: 16px;
  display: flex;
  flex-direction: column;
  color: #fff;
  background:
    radial-gradient(circle at 20% 20%, rgba(80, 220, 255, 0.26), transparent 32%),
    radial-gradient(circle at 78% 10%, rgba(155, 92, 255, 0.12), transparent 30%),
    radial-gradient(circle at 50% 90%, rgba(46, 196, 182, 0.12), transparent 32%),
    linear-gradient(135deg, #6fbce3 0%, #56a9d8 48%, #3f8fc5 100%);
  box-sizing: border-box;
  user-select: none;
}


.dna-lab-page:fullscreen,
.dna-lab-page.is-page-fullscreen {
  width: 100vw;
  height: 100vh;
  min-height: 0;
  padding: 12px;
}

.glass-panel {
  background: linear-gradient(145deg, rgba(20, 90, 135, 0.28), rgba(20, 90, 135, 0.14));
  border: 1px solid rgba(179, 235, 255, 0.26);
  border-radius: 18px;
  box-shadow: 0 18px 42px rgba(20, 80, 120, 0.18), inset 0 1px 0 rgba(255, 255, 255, 0.18);
  backdrop-filter: blur(14px);
}

.top-bar {
  min-height: 82px;
  flex: 0 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 14px 18px;
  margin-bottom: 14px;
  gap: 14px;
}


.brand-box {
  display: flex;
  align-items: center;
  gap: 14px;
  min-width: 260px;
  flex: 1 1 360px;
}

.brand-icon {
  width: 52px;
  height: 52px;
  border-radius: 18px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28px;
  background: linear-gradient(135deg, #2ec4ff, #9b5cff 65%, #ff4f9a);
  box-shadow: 0 0 24px rgba(46, 196, 255, 0.42);
}

.title-row {
  display: flex;
  align-items: center;
  gap: 12px;
}

.title-row h1 {
  margin: 0;
  font-size: 25px;
  letter-spacing: 0.04em;
  background: linear-gradient(90deg, #aef6ff, #ffffff 45%, #7cffd4);
  -webkit-background-clip: text;
  color: transparent;
}

.brand-box p {
  margin: 6px 0 0;
  color: rgba(220, 245, 255, 0.68);
  font-size: 13px;
}

.mode-actions {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  flex-wrap: wrap;
  gap: 10px;
  min-width: 0;
}

.header-quick-actions {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  justify-content: flex-end;
  gap: 8px;
}

.tech-mode-tabs {
  display: flex;
  align-items: center;
  gap: 10px;
  padding: 5px;
  border-radius: 999px;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.12), rgba(255, 255, 255, 0.04));
  border: 1px solid rgba(174, 246, 255, 0.18);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.14), 0 14px 32px rgba(0, 0, 0, 0.18);
}

.tech-mode-btn,
.header-action-btn {
  position: relative;
  height: 42px;
  border: 0;
  outline: none;
  border-radius: 999px;
  color: rgba(204, 229, 238, 0.72);
  font-weight: 800;
  letter-spacing: 0.02em;
  cursor: pointer;
  overflow: hidden;
  background:
    linear-gradient(135deg, rgba(18, 42, 70, 0.66), rgba(38, 24, 78, 0.48)),
    rgba(255, 255, 255, 0.045);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.1), 0 8px 22px rgba(0, 0, 0, 0.18);
  transition: transform 0.22s ease, color 0.22s ease, box-shadow 0.22s ease, background 0.22s ease, opacity 0.22s ease;
}

.tech-mode-btn {
  min-width: 116px;
  padding: 0 16px;
}

.header-action-btn {
  min-width: 104px;
  padding: 0 15px;
}

.tech-mode-btn::before,
.header-action-btn::before {
  content: '';
  position: absolute;
  inset: 1px;
  border-radius: inherit;
  padding: 1px;
  background: linear-gradient(135deg, rgba(141, 246, 255, 0.82), rgba(155, 92, 255, 0.28), rgba(255, 79, 154, 0.52));
  -webkit-mask: linear-gradient(#000 0 0) content-box, linear-gradient(#000 0 0);
  -webkit-mask-composite: xor;
  mask-composite: exclude;
  pointer-events: none;
}

.tech-mode-btn::after,
.header-action-btn::after {
  content: '';
  position: absolute;
  left: -38%;
  top: -110%;
  width: 58%;
  height: 310%;
  transform: rotate(24deg);
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.32), transparent);
  opacity: 0;
  transition: left 0.55s ease, opacity 0.25s ease;
}

.tech-mode-btn:hover,
.header-action-btn:hover {
  color: rgba(245, 253, 255, 0.96);
  transform: translateY(-1px);
  background: linear-gradient(135deg, rgba(46, 196, 255, 0.28), rgba(155, 92, 255, 0.2));
  box-shadow: 0 0 16px rgba(46, 196, 255, 0.18), 0 12px 28px rgba(0, 0, 0, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.16);
}

.header-action-btn:disabled {
  cursor: not-allowed;
  opacity: 0.38;
  filter: grayscale(0.25);
  transform: none;
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06), 0 4px 14px rgba(0, 0, 0, 0.14);
}

.header-action-btn:disabled:hover {
  color: rgba(204, 229, 238, 0.72);
  transform: none;
  background:
    linear-gradient(135deg, rgba(18, 42, 70, 0.66), rgba(38, 24, 78, 0.48)),
    rgba(255, 255, 255, 0.045);
}

.header-action-btn.active {
  color: #fff;
  background: linear-gradient(135deg, rgba(46, 196, 255, 0.44), rgba(46, 196, 182, 0.3), rgba(155, 92, 255, 0.3));
  box-shadow: 0 0 20px rgba(46, 196, 255, 0.28), 0 12px 28px rgba(0, 0, 0, 0.22);
}

.tech-mode-btn.active {
  color: #ffffff;
  transform: translateY(-2px);
  background:
    radial-gradient(circle at 18% 18%, rgba(255, 255, 255, 0.34), transparent 28%),
    linear-gradient(135deg, #20d8ff 0%, #2ec4b6 44%, #7b5cff 100%);
  box-shadow:
    0 0 0 1px rgba(170, 252, 255, 0.8),
    0 0 22px rgba(32, 216, 255, 0.58),
    0 0 42px rgba(123, 92, 255, 0.32),
    0 16px 34px rgba(0, 0, 0, 0.28),
    inset 0 1px 0 rgba(255, 255, 255, 0.42),
    inset 0 -10px 18px rgba(16, 16, 48, 0.22);
}

.tech-mode-btn.active .mode-icon {
  filter: drop-shadow(0 0 7px rgba(255, 255, 255, 0.75));
}

.tech-mode-btn:hover::after,
.header-action-btn:hover::after,
.header-action-btn.active::after {
  left: 118%;
  opacity: 1;
}

.tech-mode-btn.active::after {
  left: 12%;
  top: auto;
  bottom: 5px;
  width: 76%;
  height: 3px;
  transform: none;
  border-radius: 999px;
  background: linear-gradient(90deg, transparent, rgba(255, 255, 255, 0.95), rgba(157, 255, 241, 0.95), transparent);
  opacity: 1;
  box-shadow: 0 0 12px rgba(157, 255, 241, 0.92);
}

.tech-mode-btn.active::before {
  background: linear-gradient(135deg, rgba(255, 255, 255, 0.95), rgba(111, 255, 239, 0.85), rgba(174, 140, 255, 0.78));
}

.mode-icon {
  margin-right: 6px;
}

.main-layout {
  flex: 1 1 auto;
  height: auto;
  min-height: 0;
  display: grid;
  grid-template-columns: minmax(260px, 300px) minmax(0, 1fr) minmax(286px, 326px);
  grid-template-areas: 'left center right';
  gap: 14px;
}


.main-layout.left-collapsed {
  grid-template-columns: minmax(0, 1fr) minmax(286px, 326px);
  grid-template-areas: 'center right';
}

.main-layout.right-collapsed {
  grid-template-columns: minmax(260px, 300px) minmax(0, 1fr);
  grid-template-areas: 'left center';
}

.main-layout.left-collapsed.right-collapsed {
  grid-template-columns: minmax(0, 1fr);
  grid-template-areas: 'center';
}

.left-panel {
  grid-area: left;
}

.center-panel {
  grid-area: center;
}

.right-panel {
  grid-area: right;
}

.left-panel,
.right-panel {
  min-height: 0;
  overflow-y: auto;
  padding: 16px;
}

.left-panel::-webkit-scrollbar,
.right-panel::-webkit-scrollbar {
  width: 8px;
}

.left-panel::-webkit-scrollbar-track,
.right-panel::-webkit-scrollbar-track {
  background: rgba(8, 18, 34, 0.26);
  border-radius: 999px;
  margin: 8px 0;
}

.left-panel::-webkit-scrollbar-thumb,
.right-panel::-webkit-scrollbar-thumb {
  min-height: 44px;
  border-radius: 999px;
  border: 2px solid rgba(12, 24, 46, 0.72);
  background: linear-gradient(180deg, rgba(69, 216, 255, 0.78), rgba(153, 119, 255, 0.68));
  box-shadow: inset 0 0 7px rgba(255, 255, 255, 0.36), 0 0 12px rgba(69, 216, 255, 0.28);
}

.left-panel::-webkit-scrollbar-thumb:hover,
.right-panel::-webkit-scrollbar-thumb:hover {
  background: linear-gradient(180deg, rgba(104, 236, 255, 0.95), rgba(176, 142, 255, 0.9));
}

.left-panel,
.right-panel {
  scrollbar-width: thin;
  scrollbar-color: rgba(91, 218, 255, 0.74) rgba(8, 18, 34, 0.22);
}

.panel-title {
  display: flex;
  align-items: center;
  gap: 10px;
  margin-bottom: 12px;
}

.panel-icon {
  font-size: 28px;
}

.panel-title h2 {
  margin: 0;
  font-size: 18px;
}

.panel-title p {
  margin: 4px 0 0;
  font-size: 12px;
  color: rgba(231, 250, 255, 0.6);
}

.mode-alert {
  margin-bottom: 12px;
}

.component-group-list {
  display: flex;
  flex-direction: column;
  gap: 14px;
}

.palette-section {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.palette-section-title {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: 0 2px;
}

.palette-section-title span {
  font-size: 13px;
  font-weight: 800;
  letter-spacing: 0.04em;
  color: rgba(238, 251, 255, 0.9);
}

.palette-section-title em {
  font-style: normal;
  font-size: 11px;
  line-height: 1.35;
  color: rgba(196, 227, 255, 0.56);
}

.component-list {
  display: flex;
  flex-direction: column;
  gap: 10px;
}

.component-card {
  position: relative;
  display: grid;
  grid-template-columns: 76px minmax(0, 1fr);
  gap: 12px;
  padding: 12px;
  border-radius: 16px;
  cursor: grab;
  overflow: hidden;
  background: linear-gradient(145deg, rgba(255, 255, 255, 0.14), rgba(255, 255, 255, 0.06));
  border: 1px solid rgba(255, 255, 255, 0.12);
  transition: transform 0.22s ease, border-color 0.22s ease, box-shadow 0.22s ease;
}

.component-card:hover {
  transform: translateY(-3px);
  border-color: rgba(174, 246, 255, 0.5);
  box-shadow: 0 16px 34px rgba(0, 0, 0, 0.26);
}

.component-card:active {
  cursor: grabbing;
}

.preview-wrap {
  position: relative;
  width: 70px;
  height: 70px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.preview-glow {
  position: absolute;
  inset: -16px;
  filter: blur(2px);
}

.molecule-preview {
  position: relative;
  width: 58px;
  height: 58px;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: 800;
  color: #fff;
  text-shadow: 0 2px 10px rgba(0, 0, 0, 0.5);
}

.preview-phosphate {
  border-radius: 50%;
  font-size: 26px;
  background: radial-gradient(circle at 30% 25%, #fff5bc, #f5b642 52%, #d98200);
  box-shadow: inset -8px -10px 18px rgba(102, 51, 0, 0.35), 0 0 22px rgba(245, 182, 66, 0.5);
}

.preview-sugar svg {
  width: 62px;
  height: 62px;
  overflow: visible;
  filter: drop-shadow(0 0 14px rgba(52, 212, 255, 0.6));
}

.preview-sugar polygon {
  fill: #34d4ff;
  stroke: rgba(255, 255, 255, 0.92);
  stroke-width: 3;
}

.preview-sugar .sugar-bond {
  fill: none;
  stroke: rgba(225, 250, 255, 0.9);
  stroke-width: 4.2;
  stroke-linecap: round;
  filter: drop-shadow(0 0 4px rgba(52, 212, 255, 0.55));
}

.preview-sugar .sugar-oxygen-dot {
  fill: #ff4d4f;
  stroke: rgba(255, 255, 255, 0.95);
  stroke-width: 2.1;
  filter: drop-shadow(0 0 5px rgba(255, 77, 79, 0.6));
}

.preview-sugar text {
  fill: #fff;
  font-size: 14px;
  font-weight: 800;
}

.preview-sugar .sugar-oxygen-text {
  font-size: 9px;
  font-weight: 900;
}

.preview-sugar .sugar-carbon-label {
  font-size: 20px;
  font-weight: 900;
  fill: rgba(255, 255, 255, 0.98);
  text-shadow: 0 0 5px rgba(255, 255, 255, 0.45);
}

.preview-sugar .sugar-carbon-label-five {
  font-size: 17px;
  fill: rgba(236, 255, 255, 0.98);
}

.preview-sugar .sugar-bond-five {
  stroke-width: 3.2;
}

.preview-sugar .sugar-preview-reverse {
  transform-box: fill-box;
  transform-origin: center;
  transform: rotate(180deg);
}

.preview-sugar .sugar-preview-reverse text {
  transform-box: fill-box;
  transform-origin: center;
  transform: rotate(180deg);
}

.ring-preview {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #fff;
  font-size: 24px;
  font-weight: 900;
}

.ring-preview span {
  position: relative;
  z-index: 3;
}

.double-ring {
  width: 68px;
  height: 48px;
}

.double-ring::before,
.double-ring::after,
.single-ring::before {
  content: '';
  position: absolute;
  border: 4px solid rgba(255, 255, 255, 0.88);
  box-shadow: 0 0 16px currentColor, inset 0 0 14px currentColor;
  background: rgba(255, 255, 255, 0.08);
}

.double-ring::before {
  width: 36px;
  height: 36px;
  left: 6px;
  clip-path: polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%);
}

.double-ring::after {
  width: 30px;
  height: 30px;
  right: 6px;
  clip-path: polygon(50% 0, 100% 38%, 82% 100%, 18% 100%, 0 38%);
}

.single-ring {
  width: 52px;
  height: 52px;
}

.single-ring::before {
  width: 42px;
  height: 42px;
  clip-path: polygon(25% 0, 75% 0, 100% 50%, 75% 100%, 25% 100%, 0 50%);
}

.preview-a {
  color: #ff4f9a;
}

.preview-t {
  color: #9b5cff;
}

.preview-g {
  color: #ff8a3d;
}

.preview-c {
  color: #20d789;
}

.component-text {
  min-width: 0;
}

.component-name {
  font-size: 15px;
  font-weight: 800;
  margin-bottom: 0;
}

.component-desc {
  font-size: 12px;
  line-height: 1.45;
  color: rgba(232, 248, 255, 0.72);
}

.component-tips {
  margin-top: 6px;
  font-size: 12px;
  color: #8df6ff;
}

.pair-rule-card {
  padding: 12px;
  border-radius: 15px;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.1);
}

.science-fix-card .pair-rule-card {
  margin-top: 2px;
  padding: 0;
  border: none;
  background: transparent;
}

.pair-line {
  display: flex;
  align-items: center;
  gap: 7px;
  margin-bottom: 9px;
  font-size: 12px;
}

.pair-line:last-child {
  margin-bottom: 0;
}

.base-chip {
  padding: 5px 7px;
  border-radius: 8px;
  font-weight: 800;
  white-space: nowrap;
}

.base-chip.a {
  background: linear-gradient(135deg, #ff4f9a, #b9205d);
}

.base-chip.t {
  background: linear-gradient(135deg, #9b5cff, #552fc7);
}

.base-chip.g {
  background: linear-gradient(135deg, #ff8a3d, #b84a10);
}

.base-chip.c {
  background: linear-gradient(135deg, #20d789, #128c62);
  color: #eafff7;
}

.bond-dot {
  color: #eaffff;
  letter-spacing: 2px;
  text-shadow: 0 0 10px #fff;
}

.pair-line em {
  margin-left: auto;
  color: rgba(229, 249, 255, 0.72);
  font-style: normal;
}

.pair-rule-card p {
  margin: 8px 0 0;
  font-size: 12px;
  line-height: 1.6;
  color: rgba(231, 249, 255, 0.66);
}

.center-panel {
  position: relative;
  min-width: 0;
  overflow: hidden;
}

.canvas-wrap {
  position: absolute;
  inset: 0;
  background:
    radial-gradient(circle at 24% 22%, rgba(72, 214, 255, 0.16), transparent 34%),
    radial-gradient(circle at 78% 16%, rgba(155, 92, 255, 0.075), transparent 32%),
    linear-gradient(135deg, #6fbce3 0%, #56a9d8 46%, #3f8fc5 100%);
}

:deep(.dna-three-canvas) {
  display: block;
  width: 100% !important;
  height: 100% !important;
  cursor: grab;
}

.scene-hint-card {
  position: absolute;
  z-index: 6;
  left: 16px;
  top: 16px;
  width: 312px;
  max-width: 34%;
  padding: 11px 14px;
  display: flex;
  flex-direction: column;
  gap: 5px;
  pointer-events: none;
}

.scene-hint-card span {
  color: #99f7ff;
  font-size: 12px;
  font-weight: 800;
}

.scene-hint-card strong {
  color: rgba(234, 251, 255, 0.82);
  font-size: 12px;
  line-height: 1.55;
  font-weight: 600;
}

.build-hint {
  position: absolute;
  z-index: 5;
  left: 50%;
  top: 18px;
  transform: translateX(-50%);
  min-width: 380px;
  max-width: 62%;
  display: flex;
  flex-direction: column;
  gap: 4px;
  padding: 10px 16px;
  text-align: center;
  pointer-events: none;
}

.build-hint strong {
  color: #99f7ff;
  font-size: 15px;
}

.build-hint span {
  color: rgba(232, 250, 255, 0.78);
  font-size: 12px;
}

.build-hint.warning strong {
  color: #ffe18a;
}

.selected-card {
  position: absolute;
  z-index: 5;
  right: 16px;
  top: 16px;
  width: 320px;
  padding: 12px 14px;
  pointer-events: auto;
}

.selected-card-head {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 10px;
  margin-bottom: 4px;
}

.selected-title {
  font-size: 14px;
  font-weight: 800;
  color: #eaffff;
}

.selected-cancel-btn {
  border: 1px solid rgba(126, 231, 255, 0.38);
  background: linear-gradient(135deg, rgba(46, 196, 182, 0.18), rgba(79, 124, 255, 0.16));
  color: rgba(232, 253, 255, 0.92);
  border-radius: 999px;
  padding: 3px 10px;
  font-size: 12px;
  cursor: pointer;
  white-space: nowrap;
  box-shadow: 0 0 12px rgba(46, 196, 182, 0.12);
  transition: all 0.18s ease;
}

.selected-cancel-btn:hover {
  color: #ffffff;
  border-color: rgba(126, 231, 255, 0.62);
  box-shadow: 0 0 18px rgba(46, 196, 182, 0.24);
  transform: translateY(-1px);
}

.selected-subtitle {
  margin-top: 5px;
  font-size: 12px;
  line-height: 1.55;
  color: rgba(231, 249, 255, 0.7);
}


.science-fix-cards {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-bottom: 12px;
}

.science-fix-card {
  position: relative;
  margin-bottom: 0;
  padding: 12px 13px 12px 15px;
  overflow: hidden;
  border-radius: 10px;
  background: rgba(255, 255, 255, 0.065);
  border: 1px solid rgba(255, 255, 255, 0.055);
  box-shadow: inset 0 1px 0 rgba(255, 255, 255, 0.06);
}


.science-fix-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  bottom: 0;
  width: 3px;
  border-radius: 10px 0 0 10px;
  background: var(--fix-color);
  box-shadow: 0 0 14px var(--fix-glow);
}

.science-fix-card h3 {
  margin: 0 0 6px;
  color: var(--fix-color);
  font-size: 15px;
  font-weight: 900;
}

.science-fix-card p {
  margin: 0;
  font-size: 12px;
  line-height: 1.65;
  color: rgba(235, 249, 255, 0.78);
}

.fix-green {
  --fix-color: #35f6a1;
  --fix-glow: rgba(53, 246, 161, 0.42);
}

.fix-blue {
  --fix-color: #55b7ff;
  --fix-glow: rgba(85, 183, 255, 0.42);
}

.fix-purple {
  --fix-color: #d487ff;
  --fix-glow: rgba(212, 135, 255, 0.42);
}

.fix-orange {
  --fix-color: #ffb347;
  --fix-glow: rgba(255, 179, 71, 0.42);
}

.knowledge-card,
.quiz-card,
.progress-card,
.ops-card {
  margin-bottom: 12px;
  border: 1px solid rgba(174, 246, 255, 0.15);
  background: rgba(255, 255, 255, 0.06);
  color: #fff;
}

:deep(.el-card__header) {
  border-bottom-color: rgba(255, 255, 255, 0.1);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  font-weight: 800;
}

.knowledge-card p,
.quiz-card p {
  margin: 0 0 10px;
  color: rgba(234, 250, 255, 0.77);
  font-size: 13px;
  line-height: 1.7;
}

.knowledge-card ul {
  margin: 0;
  padding-left: 18px;
  color: rgba(234, 250, 255, 0.76);
  font-size: 12px;
  line-height: 1.75;
}

.quiz-card h3 {
  margin: 0 0 8px;
  font-size: 15px;
  color: #ffe18a;
}

.quiz-actions {
  display: flex;
  gap: 7px;
}

.quiz-result {
  margin-top: 10px;
  padding: 9px 10px;
  border-radius: 10px;
  font-size: 12px;
  line-height: 1.5;
}

.quiz-result.correct {
  color: #9effd1;
  background: rgba(47, 209, 121, 0.13);
  border: 1px solid rgba(47, 209, 121, 0.28);
}

.quiz-result.wrong {
  color: #ffd0d0;
  background: rgba(255, 80, 80, 0.12);
  border: 1px solid rgba(255, 80, 80, 0.28);
}

.progress-item {
  margin-bottom: 14px;
}

.progress-label {
  display: flex;
  justify-content: space-between;
  margin-bottom: 7px;
  font-size: 12px;
  color: rgba(232, 250, 255, 0.78);
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(2, 1fr);
  gap: 8px;
  margin-top: 12px;
}

.stats-grid div {
  padding: 10px;
  border-radius: 12px;
  text-align: center;
  background: rgba(255, 255, 255, 0.07);
  border: 1px solid rgba(255, 255, 255, 0.08);
}

.stats-grid strong {
  display: block;
  font-size: 20px;
  color: #8df6ff;
}

.stats-grid span {
  font-size: 12px;
  color: rgba(232, 250, 255, 0.65);
}

.ops-list {
  display: flex;
  flex-direction: column;
  gap: 9px;
}

.ops-list .el-button {
  margin-left: 0 !important;
  width: 100%;
}


:deep(.el-divider__text) {
  color: rgba(232, 250, 255, 0.75);
  background: transparent;
}

:deep(.el-divider) {
  border-top-color: rgba(255, 255, 255, 0.13);
}

:deep(.el-button) {
  border-radius: 10px;
}

@media (max-width: 1440px) {
  .dna-lab-page {
    padding: 12px;
  }

  .top-bar {
    padding: 12px 14px;
  }

  .main-layout {
    grid-template-columns: minmax(230px, 270px) minmax(0, 1fr) minmax(260px, 292px);
    gap: 12px;
  }

  .title-row h1 {
    font-size: 21px;
  }

  .brand-icon {
    width: 46px;
    height: 46px;
    border-radius: 15px;
    font-size: 24px;
  }

  .tech-mode-btn {
    min-width: 104px;
    padding: 0 12px;
  }

  .header-action-btn {
    min-width: 92px;
    padding: 0 12px;
  }

  .component-card {
    grid-template-columns: 64px minmax(0, 1fr);
    gap: 10px;
    padding: 10px;
  }

  .preview-wrap {
    width: 60px;
    height: 60px;
  }

  .molecule-preview {
    width: 52px;
    height: 52px;
  }
}

@media (max-width: 1180px) {
  .dna-lab-page {
    min-height: 100vh;
  }

  .top-bar {
    align-items: flex-start;
    flex-wrap: wrap;
  }

  .mode-actions {
    width: 100%;
    justify-content: space-between;
  }

  .main-layout {
    grid-template-columns: minmax(0, 1fr) minmax(0, 1fr);
    grid-template-rows: minmax(430px, 1fr) minmax(260px, 34vh);
    grid-template-areas:
      'center center'
      'left right';
  }

  .main-layout.left-collapsed {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(430px, 1fr) minmax(260px, 34vh);
    grid-template-areas:
      'center'
      'right';
  }

  .main-layout.right-collapsed {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(430px, 1fr) minmax(260px, 34vh);
    grid-template-areas:
      'center'
      'left';
  }

  .main-layout.left-collapsed.right-collapsed {
    grid-template-columns: minmax(0, 1fr);
    grid-template-rows: minmax(430px, 1fr);
    grid-template-areas: 'center';
  }

  .left-panel,
  .right-panel {
    padding: 14px;
  }

  .scene-hint-card {
    max-width: 42%;
  }

  .selected-card {
    width: min(320px, calc(50% - 28px));
  }
}

@media (max-width: 860px) {
  .dna-lab-page {
    height: auto;
    min-height: 100vh;
    overflow-y: auto;
    padding: 10px;
  }

  .top-bar {
    margin-bottom: 10px;
    border-radius: 16px;
  }

  .brand-box {
    width: 100%;
    flex: 1 1 100%;
    min-width: 0;
  }

  .brand-icon {
    width: 42px;
    height: 42px;
    border-radius: 14px;
    font-size: 22px;
  }

  .title-row h1 {
    font-size: 18px;
  }

  .brand-box p {
    font-size: 11px;
    line-height: 1.45;
  }

  .mode-actions {
    overflow-x: auto;
    padding-bottom: 2px;
    scrollbar-width: none;
  }

  .mode-actions::-webkit-scrollbar {
    display: none;
  }

  .tech-mode-tabs,
  .header-quick-actions {
    flex: 0 0 max-content;
    flex-wrap: nowrap;
  }

  .tech-mode-btn,
  .header-action-btn {
    height: 38px;
    min-width: auto;
    padding: 0 12px;
    font-size: 12px;
  }

  .main-layout {
    height: auto;
    min-height: 0;
    display: grid;
    grid-template-columns: 1fr;
    grid-template-rows: 58vh auto auto;
    grid-template-areas:
      'center'
      'left'
      'right';
    gap: 10px;
  }

  .main-layout.left-collapsed {
    grid-template-rows: 58vh auto;
    grid-template-areas:
      'center'
      'right';
  }

  .main-layout.right-collapsed {
    grid-template-rows: 58vh auto;
    grid-template-areas:
      'center'
      'left';
  }

  .main-layout.left-collapsed.right-collapsed {
    grid-template-rows: 58vh;
    grid-template-areas: 'center';
  }

  .center-panel {
    min-height: 430px;
  }

  .left-panel,
  .right-panel {
    max-height: none;
    overflow: visible;
    padding: 12px;
  }

  .component-list {
    display: grid;
    grid-template-columns: repeat(2, minmax(0, 1fr));
    gap: 10px;
  }

  .component-group-list {
    gap: 12px;
  }

  .component-card {
    grid-template-columns: 54px minmax(0, 1fr);
    gap: 8px;
  }

  .preview-wrap {
    width: 54px;
    height: 54px;
  }

  .molecule-preview {
    width: 48px;
    height: 48px;
  }

  .component-name {
    font-size: 13px;
  }

  .component-desc,
  .component-tips {
    font-size: 11px;
  }

  .scene-hint-card,
  .build-hint,
  .selected-card {
    left: 10px;
    right: 10px;
    width: auto;
    max-width: none;
  }

  .scene-hint-card {
    top: 10px;
  }

  .build-hint {
    top: 80px;
    min-width: 0;
    transform: none;
  }

  .selected-card {
    top: auto;
    bottom: 10px;
  }

  .stats-grid {
    grid-template-columns: repeat(4, minmax(0, 1fr));
  }
}

@media (max-width: 560px) {
  .dna-lab-page {
    padding: 8px;
  }

  .top-bar {
    padding: 10px;
  }

  .brand-box {
    gap: 10px;
  }

  .title-row h1 {
    font-size: 16px;
  }

  .brand-box p {
    display: none;
  }

  .main-layout {
    grid-template-rows: 54vh auto auto;
  }

  .center-panel {
    min-height: 360px;
    border-radius: 14px;
  }

  .component-list {
    grid-template-columns: 1fr;
  }

  .pair-line {
    flex-wrap: wrap;
  }

  .pair-line em {
    width: 100%;
    margin-left: 0;
  }

  .scene-hint-card,
  .build-hint {
    padding: 9px 11px;
  }

  .build-hint {
    top: 74px;
  }

  .build-hint strong {
    font-size: 13px;
  }

  .scene-hint-card strong,
  .build-hint span,
  .selected-subtitle {
    font-size: 11px;
  }

  .stats-grid {
    grid-template-columns: repeat(2, minmax(0, 1fr));
  }
}

/* v77：全屏模式下，Element Plus Dialog 不能 append 到 body。
   浏览器全屏只显示 fullscreenElement 及其子节点；弹窗如果 Teleport 到 body，
   会被排除在全屏渲染树之外，表现为“答题弹窗出不来，退出全屏才看到”。 */
:global(.dna-lab-page .el-overlay.dna-quiz-overlay) {
  position: fixed;
  inset: 0;
  z-index: 5000;
}

:global(.dna-lab-page:fullscreen .el-overlay.dna-quiz-overlay),
:global(.dna-lab-page.is-page-fullscreen .el-overlay.dna-quiz-overlay) {
  z-index: 9999;
}

:global(.dna-quiz-dialog.el-dialog) {
  --el-dialog-bg-color: rgba(33, 37, 48, 0.94);
  --el-dialog-border-radius: 18px;
  border: 1px solid rgba(255, 255, 255, 0.16);
  box-shadow: 0 28px 70px rgba(0, 0, 0, 0.48);
  overflow: hidden;
}

:global(.dna-quiz-dialog.el-dialog .el-dialog__header) {
  margin: 0;
  padding: 22px 28px;
  border-bottom: 1px solid rgba(255, 255, 255, 0.12);
}

:global(.dna-quiz-dialog.el-dialog .el-dialog__body) {
  padding: 0;
}

:global(.dna-quiz-dialog.el-dialog .el-dialog__footer) {
  padding: 18px 28px;
  border-top: 1px solid rgba(255, 255, 255, 0.12);
  background: rgba(18, 22, 32, 0.68);
}

:global(.dna-quiz-dialog .quiz-dialog-head),
:global(.dna-quiz-dialog .quiz-dialog-footer) {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: 14px;
}

:global(.dna-quiz-dialog .quiz-dialog-title) {
  display: flex;
  align-items: center;
  gap: 10px;
  font-size: 22px;
  color: #f5fbff;
}

:global(.dna-quiz-dialog .quiz-score) {
  color: #6bb5ff;
  font-weight: 800;
  font-size: 20px;
}

:global(.dna-quiz-dialog .quiz-dialog-body) {
  max-height: min(58vh, 560px);
  overflow-y: auto;
  overscroll-behavior: contain;
  padding: 18px 28px 22px;
}

:global(.dna-quiz-dialog .quiz-dialog-body::-webkit-scrollbar) {
  width: 8px;
}

:global(.dna-quiz-dialog .quiz-dialog-body::-webkit-scrollbar-track) {
  background: rgba(255, 255, 255, 0.06);
  border-radius: 999px;
}

:global(.dna-quiz-dialog .quiz-dialog-body::-webkit-scrollbar-thumb) {
  background: linear-gradient(180deg, #39d8ff, #7b61ff);
  border-radius: 999px;
}

:global(.dna-quiz-dialog .quiz-question-card) {
  padding: 20px;
  border-radius: 12px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(255, 255, 255, 0.055);
  margin-bottom: 18px;
}

:global(.dna-quiz-dialog .quiz-question-card h3) {
  margin: 0 0 14px;
  color: #f2f7ff;
  font-size: 18px;
  line-height: 1.55;
}

:global(.dna-quiz-dialog .quiz-option-group) {
  width: 100%;
  display: grid;
  gap: 10px;
}

:global(.dna-quiz-dialog .quiz-option.el-radio) {
  height: auto;
  margin: 0;
  padding: 13px 14px;
  border-radius: 6px;
  border: 1px solid rgba(255, 255, 255, 0.18);
  background: rgba(255, 255, 255, 0.04);
  color: #f4f8ff;
  transition: all 0.18s ease;
}

:global(.dna-quiz-dialog .quiz-option.el-radio .el-radio__label) {
  color: inherit;
  font-weight: 700;
  white-space: normal;
  line-height: 1.4;
}

:global(.dna-quiz-dialog .quiz-option.is-correct) {
  border-color: #19d67f;
  background: rgba(25, 214, 127, 0.25);
}

:global(.dna-quiz-dialog .quiz-option.is-wrong) {
  border-color: #ff4f4f;
  background: rgba(255, 79, 79, 0.28);
}

:global(.dna-quiz-dialog .quiz-explain) {
  margin-top: 12px;
  padding: 12px 14px;
  border-radius: 6px;
  line-height: 1.55;
  font-weight: 700;
}

:global(.dna-quiz-dialog .quiz-explain.correct) {
  color: #23e287;
  background: rgba(25, 214, 127, 0.18);
  border-left: 4px solid #23e287;
}

:global(.dna-quiz-dialog .quiz-explain.wrong) {
  color: #ff5e4f;
  background: rgba(255, 79, 79, 0.16);
  border-left: 4px solid #ff4f4f;
}


:global(.dna-quiz-dialog.el-dialog) {
  background: linear-gradient(145deg, rgba(31, 36, 50, 0.98), rgba(18, 23, 34, 0.98)) !important;
  color: #f4f8ff !important;
  max-height: 88vh;
  display: flex;
  flex-direction: column;
}

:global(.dna-quiz-dialog.el-dialog .el-dialog__body) {
  flex: 1;
  min-height: 0;
  overflow: hidden;
  background: rgba(18, 22, 32, 0.72) !important;
  color: #f4f8ff !important;
}

:global(.dna-quiz-dialog.el-dialog .el-dialog__close) {
  color: rgba(244, 248, 255, 0.78) !important;
  font-size: 18px;
}

:global(.dna-quiz-dialog.el-dialog .el-dialog__close:hover) {
  color: #6bdcff !important;
}

:global(.dna-quiz-dialog .el-radio__input.is-checked .el-radio__inner) {
  border-color: #55b8ff !important;
  background: #55b8ff !important;
}

:global(.dna-quiz-dialog .el-radio__input.is-disabled + .el-radio__label) {
  color: inherit !important;
}

:global(.dna-quiz-dialog .el-radio__input.is-disabled .el-radio__inner) {
  background: transparent !important;
  border-color: rgba(255, 255, 255, 0.44) !important;
}

:global(.dna-quiz-dialog .el-radio__input.is-disabled.is-checked .el-radio__inner) {
  background: #55b8ff !important;
  border-color: #55b8ff !important;
}
</style>
