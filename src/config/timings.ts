/**
 * 节奏参数 —— 动画/行为的时间配置（社区可改，不必懂代码）
 *
 * 所有"多久触发/持续多久"都集中在这里。
 */
export const timings = {
  // 生命行为
  idleActMin: 18000, // 小动作最小间隔 ms
  idleActMax: 35000, // 小动作最大间隔 ms
  actDuration: 2600, // 单个小动作时长 ms
  walkAfterIdle: 45000, // 闲置多久开始散步 ms
  hideAfterEdge: 5000, // 贴边后多久去睡觉 ms
  sleepFallback: 90000, // 散步链中断时的兜底睡眠 ms
  rubDuration: 1200, // 醒后揉眼时长 ms
  walkStepMs: 33, // 散步步进间隔 ms（≈30fps）
  walkStepPx: 6, // 散步每步像素
  edgeVisible: 110, // 贴边时露出宽度 px

  // 窗口
  chatWidthDefault: 480, // chat 初始宽度
  chatWidthMin: 300, // 宽度下限（手柄可拖）
  chatWidthOpenMin: 420, // 打开 chat 的最小宽度（保证输入框/发送按钮显示）
  chatH: 520, // 聊天窗固定高度（正常聊天框）
  petW: 200, // 宠物模式宽
  petH: 230, // 宠物模式高

  // 舞蹈彩蛋
  danceW: 420, // 舞台宽
  danceH: 480, // 舞台高
  danceTotal: 12000, // 舞蹈总时长 ms
  danceSteps: {
    // 舞步时间轴（绝对排程 ms）
    entrance: 100,
    moonwalk: 1400,
    spin: 4800,
    tilt: 7200,
    curtain: 9600,
  },

  // 表情/眼睛
  happyDuration: 900, // 开心跳时长
  pupilRange: 3, // 眼睛跟随最大偏移 px
  pupilChatX: 2.5, // chat 模式瞳孔固定右偏
  pupilSensitivity: 40, // 跟随灵敏度（鼠标偏移/40）
};
