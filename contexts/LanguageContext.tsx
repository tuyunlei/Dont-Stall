
import React, { createContext, useContext, useState, useEffect } from 'react';

type Language = 'zh-CN' | 'en-US';

interface LanguageContextType {
  language: Language;
  setLanguage: (lang: Language) => void;
  t: (key: string, params?: Record<string, string | number>) => string;
}

const translations: Record<Language, Record<string, string>> = {
  'zh-CN': {
    // App Shell
    'app.title': 'ProDriver Lab',
    'app.subtitle': '专业驾驶物理模拟器',
    'app.mode.sandbox': '自由沙盒模式',
    'menu.switch': '切换课程 / 菜单',
    'menu.title': '驾驶课程选择',
    'menu.desc': '选择一个训练项目开始练习，或进入沙盒模式自由驾驶。',
    'menu.close': '关闭 [ESC]',
    
    // Sandbox
    'sandbox.title': '车辆工程实验室 v3.0',
    'sandbox.preset': '预设',
    'sandbox.preset.select': '-- 选择预设 --',
    'sandbox.group.engine': '引擎 (动力)',
    'sandbox.group.chassis': '底盘 (操控)',
    'sandbox.group.controls': '控制 (手感)',
    'sandbox.friction': '摩擦模型参数',
    
    // Dashboard
    'dash.rpm': '转速',
    'dash.speed': '速度',
    'dash.gear': '挡位',
    'dash.steer': '转向',
    'dash.clutch': '离合',
    'dash.brake': '刹车',
    'dash.throttle': '油门',
    'dash.engine_status': '引擎状态',
    'dash.stall_warning': '熄火警告',

    // Game Canvas Messages
    'msg.reset': '重置车辆',
    'msg.engine_on': '引擎启动',
    'msg.engine_off': '引擎关闭',
    'msg.clutch_warn': '请踩下离合器换挡!',
    'msg.collision': '碰撞! 引擎熄火',
    'msg.success': '任务完成! 完美停车',
    'hud.physics': '物理内核 3.0 STABLE',
    'hud.slope': '坡度',
    'hud.flat': '平路',
    'hud.state': '状态',

    // Help
    'help.basic': '基础操作',
    'help.advanced': '进阶操作',
    'key.throttle': '[↑] 油门',
    'key.brake': '[↓] 刹车',
    'key.steer': '[←/→] 转向',
    'key.clutch': '[Q] 离合器',
    'key.shift': '[W/S] 升降档',
    'key.engine': '[E] 引擎开关',
    'key.reset': '[R] 重置车辆',

    // Levels
    'level.lvl1.name': '课程一：直线起步与停车',
    'level.lvl1.desc': '最基础的驾驶训练。练习离合器与油门的配合，平稳起步并停在目标区域。',
    'level.lvl1.inst': '1. 按 [E] 启动引擎\n2. 按 [Q] 踩住离合\n3. 按 [W] 挂入1档\n4. 轻按 [↑] 给油，将转速维持在 1500-2000 转\n5. 慢慢松开 [Q] 离合找到半联动点\n6. 车身动起来后完全松开离合\n7. 到达绿色方框区域刹车停稳',
    
    'level.lvl2.name': '课程二：基础倒车入库',
    'level.lvl2.desc': '学习使用倒档和后视镜原理（想象），将车辆停入指定车位。',
    'level.lvl2.inst': '1. 向前开过车位，车尾超过库口\n2. 踩离合刹车停稳\n3. 按 [S] 挂入倒档 (R)\n4. 控制好离合器（半联动），缓慢倒车\n5. 配合转向倒入车位',
    
    'level.lvl3.name': '课程三：坡道起步',
    'level.lvl3.desc': '进阶测试。在15%的坡度上完成起步，不溜车、不熄火。',
    'level.lvl3.inst': '注意：本关卡处于上坡路段！\n1. 启动引擎，挂入1档\n2. 保持刹车防止溜车\n3. 慢慢抬离合直到车身颤抖（RPM下降）\n4. 稳住离合，快速松刹车并跟油门\n5. 目标是平稳爬坡',

    'mode.sandbox.name': '自由沙盒模式',
    'mode.sandbox.desc': '调整物理参数，自由驾驶，测试车辆极限。',
    
    'mode.tests.name': '系统诊断',
    'mode.tests.desc': '运行物理引擎单元测试套件，验证起步、刹车、熄火逻辑等核心功能。',

    // Tests UI
    'tests.title': '系统诊断',
    'tests.rerun': '重新运行',
    'tests.close': '关闭',
    'tests.pass': '通过',
    'tests.fail': '失败',
    'tests.export': '导出错误日志',
    'tests.select': '选择左侧测试用例查看详情',
    'tests.assertion_fail': '断言失败：',

    // Test Content (Names & Steps)
    'test.unit_eng_01.name': '引擎扭矩锚点测试',
    'test.unit_eng_01.desc': '验证扭矩输出是否符合物理标定锚点。',
    'test.unit_eng_01.s1': '检查发动机制动：3000 RPM, 0 油门 -> 目标 [-80, -20] Nm',
    'test.unit_eng_01.s2': '检查动力输出：3000 RPM, 1.0 油门 -> 目标 > 100 Nm',

    'test.unit_gear_01.name': '齿轮比与轮速',
    'test.unit_gear_01.desc': '检查齿轮比计算及RPM换算。',
    'test.unit_gear_01.s1': '获取2档齿轮比',
    'test.unit_gear_01.s2': '计算总传动比 (含终传比)',
    'test.unit_gear_01.s3': '验证RPM到轮速的换算因子',

    'test.unit_brake_01.name': '刹车偏置与扭矩',
    'test.unit_brake_01.desc': '确保刹车力度分配正确。',
    'test.unit_brake_01.s1': '输入 100% 刹车',
    'test.unit_brake_01.s2': '检查前后轮扭矩是否符合偏置设定',
    'test.unit_brake_01.s3': '验证总刹车扭矩',

    'test.unit_tire_01.name': '轮胎饱和模型',
    'test.unit_tire_01.desc': '验证轮胎受力的软饱和曲线。',
    'test.unit_tire_01.s1': '测试线性区（小滑移率）',
    'test.unit_tire_01.s2': '测试饱和区（大滑移率）',
    'test.unit_tire_01.s3': '确保输出不超过归一化限制 1.0',

    'test.unit_input_01.name': '转向灵敏度曲线',
    'test.unit_input_01.desc': '检查转向响应时间 (tau) 随速度的变化。',
    'test.unit_input_01.s1': '采样 0 m/s 时的 Tau',
    'test.unit_input_01.s2': '采样 50 m/s 时的 Tau',
    'test.unit_input_01.s3': '断言 Tau 随速度增加（高速转向变沉/变慢）',

    'test.scn_idle_01.name': '空档怠速稳定性',
    'test.scn_idle_01.desc': '引擎应在无输入空档状态下维持转速。',
    'test.scn_idle_01.s1': '启动引擎',
    'test.scn_idle_01.s2': '等待 60 帧 (1秒)',
    'test.scn_idle_01.s3': '检查 RPM 稳定性',

    'test.scn_start_flat_01.name': '平地起步',
    'test.scn_start_flat_01.desc': '平地静止状态下的平稳起步。',
    'test.scn_start_flat_01.s1': '引擎开启，挂1档',
    'test.scn_start_flat_01.s2': '部分油门 (0.3)',
    'test.scn_start_flat_01.s3': '60帧内线性松开离合',
    'test.scn_start_flat_01.s4': '验证加速且未熄火',

    'test.scn_reverse_01.name': '倒档起步',
    'test.scn_reverse_01.desc': '挂入倒档起步。',
    'test.scn_reverse_01.s1': '引擎开启，挂倒档 (-1)',
    'test.scn_reverse_01.s2': '给油弹离合',
    'test.scn_reverse_01.s3': '验证负向速度',

    'test.scn_brake_stop_01.name': '刹停测试 (状态机)',
    'test.scn_brake_stop_01.desc': 'Braking from speed until full stop.',
    'test.scn_brake_stop_01.s1': '以 10 m/s 开始',
    'test.scn_brake_stop_01.s2': '施加全刹车',
    'test.scn_brake_stop_01.s3': '等待速度归零',
    'test.scn_brake_stop_01.s4': '验证停止状态 (STOPPED) 转换',

    'test.scn_hill_start_01.name': '坡道起步 (15% 坡度)',
    'test.scn_hill_start_01.desc': '验证重力影响、刹车保持和坡起能力。',
    'test.scn_hill_start_01.s1': '设置 15% 坡度',
    'test.scn_hill_start_01.s2': '刹车保持 -> 断言无移动',
    'test.scn_hill_start_01.s3': '松开刹车 -> 断言溜车',
    'test.scn_hill_start_01.s4': '油门起步 -> 断言爬坡',

    'test.scn_shift_01.name': '换挡冲击 (加加速度分析)',
    'test.scn_shift_01.desc': '测量 1-2 换挡期间的 G 值尖峰以验证平滑处理。',
    'test.scn_shift_01.s1': '1档平稳行驶',
    'test.scn_shift_01.s2': '瞬间切入2档',
    'test.scn_shift_01.s3': '测量最大 Jerk (da/dt)',
    'test.scn_shift_01.s4': '断言 Jerk < 限制值',

    'test.scn_low_blend_01.name': '低速运动学融合',
    'test.scn_low_blend_01.desc': '验证低速时轨迹遵循阿克曼几何。',
    'test.scn_low_blend_01.s1': '设置速度 2.0 m/s',
    'test.scn_low_blend_01.s2': '计算等效方向盘角度',
    'test.scn_low_blend_01.s3': '保持转向模拟',
    'test.scn_low_blend_01.s4': '对比横摆角速度 vs 运动学公式',

    'test.scn_coast_01.name': '高速滑行',
    'test.scn_coast_01.desc': '验证高速松油门时的自然减速。',
    'test.scn_coast_01.s1': '速度 25 m/s (90km/h), 4档',
    'test.scn_coast_01.s2': '完全松开油门',
    'test.scn_coast_01.s3': '模拟 1 秒',
    'test.scn_coast_01.s4': '断言速度衰减，但不突兀',
    
    // Logs
    'log.powertrain.torque_measure': '扭矩测量 @ {rpm}RPM, {throttle}% 油门: {torque} Nm',
    'assert.powertrain.braking_resistance': '引擎提供制动阻力 (负扭矩)',
    'assert.powertrain.braking_limit': '发动机制动在合理范围内 (>-80Nm)',
    'assert.powertrain.positive_torque': '有效输出正扭矩',
    'log.powertrain.gear_ratio': '挡位 {g} 齿比: {ratio}, 终传比: {final}, 总齿比: {total}',
    'assert.powertrain.ratio_pos': '总齿比为正',
    'assert.powertrain.ratio_math': '总齿比计算正确',
    
    'log.chassis.brake_dist': '前轮扭矩: {f}, 后轮扭矩: {r}, 总计: {total}',
    'assert.chassis.bias_match': '前轮扭矩符合偏置设定',
    'assert.chassis.front_stronger': '前轮制动力大于后轮 (前偏置)',
    'log.chassis.sat_io': '输入 {in} -> 输出 {out}',
    'assert.chassis.linear_slip': '小滑移率区间呈线性',
    'assert.chassis.saturates': '输出饱和 (<= 1.0)',
    'assert.chassis.reach_limit': '达到饱和极限 (> 0.9)',
    'log.chassis.steering_tau': '响应时间 Tau @ {s}m/s: {t}s',
    'assert.chassis.steering_slow': '随速度增加转向变沉/变慢',

    'log.scn.final_rpm': '最终 RPM: {rpm} (目标: {target})',
    'assert.scn.rpm_stable': 'RPM 稳定在怠速附近',
    'assert.scn.stationary': '车辆保持静止',
    'action.launching': '起步中...',
    'log.scn.final_speed': '最终速度: {v} m/s, RPM: {rpm}',
    'assert.scn.moving_fwd': '车辆向前移动',
    'assert.scn.no_stall': '引擎未熄火',
    'assert.scn.rpm_healthy': 'RPM 保持在健康范围',
    'action.reversing': '倒车中...',
    'log.scn.velocity': '速度: {v} m/s, RPM: {rpm}',
    'assert.scn.moving_back': '车辆向后移动',
    'assert.scn.engine_running': '引擎运转中',
    'action.braking': '刹车中...',
    'log.scn.stopped_frame': '在第 {f} 帧停止',
    'assert.scn.stopped_state': '车辆进入 STOPPED 状态',
    'assert.scn.zero_vel': '速度实际上为零',
    
    'action.hold_brake': '踩住刹车',
    'assert.dyn.brake_hold': '刹车在坡道上保持车辆静止',
    'action.release_brake': '松开刹车 (空档)',
    'log.dyn.rollback': '溜车速度: {v} m/s',
    'assert.dyn.rollback': '重力导致溜车',
    'log.dyn.climb': '爬坡速度: {v} m/s',
    'assert.dyn.climb': '车辆完成爬坡',
    'action.shifting_1_2': '执行 1->2 换挡',
    'log.dyn.jerk': '最大冲击度 (Jerk): {j}',
    'assert.dyn.shock': '换挡冲击被有效平滑 (<150)',
    'log.dyn.yaw': '实际横摆: {r}, 运动学理论值: {k}',
    'assert.dyn.kinematic': '低速符合运动学模型',
    'log.dyn.coast': '初速: {v1}, 末速: {v2}, 减速度: {d} m/s^2',
    'assert.dyn.decel': '车辆发生减速',
    'assert.dyn.decel_perceptible': '减速有体感 (>0.5 m/s^2)',
    'assert.dyn.decel_gentle': '减速不剧烈 (<3.0 m/s^2)',
  },
  'en-US': {
    'app.title': 'ProDriver Lab',
    'app.subtitle': 'Professional Driving Simulator',
    'app.mode.sandbox': 'Sandbox Mode',
    'menu.switch': 'Menu / Switch Level',
    'menu.title': 'Course Selection',
    'menu.desc': 'Select a training module or enter Sandbox mode.',
    'menu.close': 'Close [ESC]',

    'sandbox.title': 'Vehicle Engineering Lab v3.0',
    'sandbox.preset': 'Presets',
    'sandbox.preset.select': '-- Select Preset --',
    'sandbox.group.engine': 'Engine (Power)',
    'sandbox.group.chassis': 'Chassis (Handling)',
    'sandbox.group.controls': 'Controls (Feel)',
    'sandbox.friction': 'Friction Model Params',

    'dash.rpm': 'RPM',
    'dash.speed': 'SPEED',
    'dash.gear': 'GEAR',
    'dash.steer': 'STEER',
    'dash.clutch': 'CLU',
    'dash.brake': 'BRK',
    'dash.throttle': 'THR',
    'dash.engine_status': 'Engine Status',
    'dash.stall_warning': 'Stall Warning',

    'msg.reset': 'Car Reset',
    'msg.engine_on': 'Engine ON',
    'msg.engine_off': 'Engine OFF',
    'msg.clutch_warn': 'Press Clutch to Shift!',
    'msg.collision': 'Collision! Engine Stalled',
    'msg.success': 'Task Complete! Perfect Stop',
    'hud.physics': 'PHYSICS 3.0 STABLE',
    'hud.slope': 'SLOPE',
    'hud.flat': 'FLAT',
    'hud.state': 'STATE',

    'help.basic': 'Basic Controls',
    'help.advanced': 'Advanced Controls',
    'key.throttle': '[↑] Throttle',
    'key.brake': '[↓] Brake',
    'key.steer': '[←/→] Steer',
    'key.clutch': '[Q] Clutch',
    'key.shift': '[W/S] Shift Gear',
    'key.engine': '[E] Engine',
    'key.reset': '[R] Reset',

    'level.lvl1.name': 'Lesson 1: Straight Launch & Stop',
    'level.lvl1.desc': 'Basic training. Coordinate clutch and throttle to launch smoothly and stop in the target zone.',
    'level.lvl1.inst': '1. Press [E] to Start Engine\n2. Press [Q] to Hold Clutch\n3. Press [W] to Shift into 1st Gear\n4. Tap [↑] Throttle to hold 1500-2000 RPM\n5. Slowly release [Q] to bite point\n6. Release clutch fully once moving\n7. Brake to stop in the green zone',

    'level.lvl2.name': 'Lesson 2: Reverse Parking',
    'level.lvl2.desc': 'Learn to use Reverse gear and visualize mirrors to park in a spot.',
    'level.lvl2.inst': '1. Drive forward past the spot\n2. Stop completely\n3. Press [S] to Shift to Reverse (R)\n4. Control clutch (slip) to reverse slowly\n5. Steer into the spot',

    'level.lvl3.name': 'Lesson 3: Hill Start',
    'level.lvl3.desc': 'Advanced. Launch on a 15% slope without rolling back or stalling.',
    'level.lvl3.inst': 'Note: Uphill Section!\n1. Start Engine, 1st Gear\n2. Hold Brake to prevent rollback\n3. Release Clutch until RPM drops (Bite point)\n4. Hold Clutch, release Brake and apply Throttle\n5. Climb smoothly',

    'mode.sandbox.name': 'Sandbox Mode',
    'mode.sandbox.desc': 'Tune physical parameters, drive freely, and test limits.',

    'mode.tests.name': 'System Diagnostics',
    'mode.tests.desc': 'Run physics engine unit tests to verify launch, braking, and stall logic.',

    'tests.title': 'System Diagnostics',
    'tests.rerun': 'RERUN ALL',
    'tests.close': 'CLOSE',
    'tests.pass': 'PASS',
    'tests.fail': 'FAIL',
    'tests.export': 'EXPORT LOGS',
    'tests.select': 'Select a test case to view details',
    'tests.assertion_fail': 'ASSERTION FAILED:',

    'test.unit_eng_01.name': 'Engine Torque Anchors',
    'test.unit_eng_01.desc': 'Validate torque output against physical calibration anchors.',
    'test.unit_eng_01.s1': 'Check Engine Braking: 3000 RPM, 0 Throttle -> Target [-80, -20] Nm',
    'test.unit_eng_01.s2': 'Check Power Output: 3000 RPM, 1.0 Throttle -> Target > 100 Nm',

    'test.unit_gear_01.name': 'Gear Ratios & Wheel Speed',
    'test.unit_gear_01.desc': 'Check gear ratio calculations and RPM conversion.',
    'test.unit_gear_01.s1': 'Get Gear Ratio for 2nd gear',
    'test.unit_gear_01.s2': 'Calculate Total Ratio (includes Final Drive)',
    'test.unit_gear_01.s3': 'Verify RPM to WheelSpeed conversion factor',

    'test.unit_brake_01.name': 'Brake Bias & Torque',
    'test.unit_brake_01.desc': 'Ensure brake force distribution is correct.',
    'test.unit_brake_01.s1': 'Input 100% braking',
    'test.unit_brake_01.s2': 'Check front vs rear torque against bias config',
    'test.unit_brake_01.s3': 'Verify total braking torque',

    'test.unit_tire_01.name': 'Tire Saturation Model',
    'test.unit_tire_01.desc': 'Verify soft saturation curve for tire forces.',
    'test.unit_tire_01.s1': 'Test linear region (small slip)',
    'test.unit_tire_01.s2': 'Test saturation region (large slip)',
    'test.unit_tire_01.s3': 'Ensure output does not exceed 1.0 (normalized)',

    'test.unit_input_01.name': 'Steering Sensitivity Curve',
    'test.unit_input_01.desc': 'Check steering response time (tau) vs speed.',
    'test.unit_input_01.s1': 'Sample Tau at 0 m/s',
    'test.unit_input_01.s2': 'Sample Tau at 50 m/s',
    'test.unit_input_01.s3': 'Assert Tau increases with speed',

    'test.scn_idle_01.name': 'Neutral Idle Stability',
    'test.scn_idle_01.desc': 'Engine should maintain RPM in neutral without input.',
    'test.scn_idle_01.s1': 'Start Engine',
    'test.scn_idle_01.s2': 'Wait 60 frames (1s)',
    'test.scn_idle_01.s3': 'Check RPM stability',

    'test.scn_start_flat_01.name': 'Flat Ground Launch',
    'test.scn_start_flat_01.desc': 'Smooth launch from standstill on flat ground.',
    'test.scn_start_flat_01.s1': 'Engine On, Gear 1',
    'test.scn_start_flat_01.s2': 'Partial Throttle (0.3)',
    'test.scn_start_flat_01.s3': 'Release Clutch linearly over 60 frames',
    'test.scn_start_flat_01.s4': 'Verify acceleration and no stall',

    'test.scn_reverse_01.name': 'Reverse Gear Launch',
    'test.scn_reverse_01.desc': 'Launch in reverse gear.',
    'test.scn_reverse_01.s1': 'Engine On, Gear -1 (Reverse)',
    'test.scn_reverse_01.s2': 'Clutch dump with throttle',
    'test.scn_reverse_01.s3': 'Verify negative velocity',

    'test.scn_brake_stop_01.name': 'Brake to Stop (FSM)',
    'test.scn_brake_stop_01.desc': 'Braking from speed until full stop.',
    'test.scn_brake_stop_01.s1': 'Start at 10 m/s',
    'test.scn_brake_stop_01.s2': 'Apply Full Brakes',
    'test.scn_brake_stop_01.s3': 'Wait for speed 0',
    'test.scn_brake_stop_01.s4': 'Verify Stop State transitions',

    'test.scn_hill_start_01.name': 'Hill Start (15% Slope)',
    'test.scn_hill_start_01.desc': 'Verify gravity effects, brake holding, and hill start capability.',
    'test.scn_hill_start_01.s1': 'Set slope 15%',
    'test.scn_hill_start_01.s2': 'Hold with brakes -> Assert no movement',
    'test.scn_hill_start_01.s3': 'Release brakes -> Assert rollback',
    'test.scn_hill_start_01.s4': 'Launch with throttle -> Assert climb',

    'test.scn_shift_01.name': 'Shift Shock (Jerk Analysis)',
    'test.scn_shift_01.desc': 'Measure G-force spike during 1-2 shift to verify smoothing.',
    'test.scn_shift_01.s1': 'Drive steady in Gear 1',
    'test.scn_shift_01.s2': 'Instant shift to Gear 2',
    'test.scn_shift_01.s3': 'Measure peak Jerk (da/dt)',
    'test.scn_shift_01.s4': 'Assert Jerk < Limit',

    'test.scn_low_blend_01.name': 'Low Speed Kinematic Blend',
    'test.scn_low_blend_01.desc': 'Verify trajectory follows Ackermann geometry at low speeds.',
    'test.scn_low_blend_01.s1': 'Set speed 2.0 m/s',
    'test.scn_low_blend_01.s2': 'Calculate equivalent steering wheel angle',
    'test.scn_low_blend_01.s3': 'Simulate with held steering',
    'test.scn_low_blend_01.s4': 'Compare Yaw Rate vs Kinematic Formula',

    'test.scn_coast_01.name': 'High Speed Coasting',
    'test.scn_coast_01.desc': 'Verify natural deceleration when throttle is released at speed.',
    'test.scn_coast_01.s1': 'Set speed 25 m/s (90km/h), Gear 4',
    'test.scn_coast_01.s2': 'Release Throttle completely',
    'test.scn_coast_01.s3': 'Simulate 1 second',
    'test.scn_coast_01.s4': 'Assert Speed Decays, but not too abruptly',
    
    // Logs
    'log.powertrain.torque_measure': 'Torque @ {rpm}RPM, {throttle}% Thr: {torque} Nm',
    'assert.powertrain.braking_resistance': 'Engine provides braking resistance',
    'assert.powertrain.braking_limit': 'Engine braking is not excessively high (>-80Nm)',
    'assert.powertrain.positive_torque': 'Effective positive torque delivered to flywheel',
    'log.powertrain.gear_ratio': 'Gear {g} Ratio: {ratio}, Final: {final}, Total: {total}',
    'assert.powertrain.ratio_pos': 'Total ratio is positive',
    'assert.powertrain.ratio_math': 'Ratio math correct',
    
    'log.chassis.brake_dist': 'Front: {f}, Rear: {r}, Total: {total}',
    'assert.chassis.bias_match': 'Front torque matches bias',
    'assert.chassis.front_stronger': 'Front bias ensures front brakes are stronger',
    'log.chassis.sat_io': 'Input {in} -> Output {out}',
    'assert.chassis.linear_slip': 'Linear in small slip region',
    'assert.chassis.saturates': 'Saturates at 1.0',
    'assert.chassis.reach_limit': 'Reaches saturation limit (> 0.9)',
    'log.chassis.steering_tau': 'Tau @ {s}m/s: {t}s',
    'assert.chassis.steering_slow': 'Steering becomes slower/heavier at speed',

    'log.scn.final_rpm': 'Final RPM: {rpm} (Target: {target})',
    'assert.scn.rpm_stable': 'RPM stabilized near idle target',
    'assert.scn.stationary': 'Car remains stationary',
    'action.launching': 'Launching...',
    'log.scn.final_speed': 'Final Speed: {v} m/s, RPM: {rpm}',
    'assert.scn.moving_fwd': 'Car is moving forward',
    'assert.scn.no_stall': 'Engine did not stall',
    'assert.scn.rpm_healthy': 'RPM stayed healthy',
    'action.reversing': 'Reversing...',
    'log.scn.velocity': 'Velocity: {v} m/s, RPM: {rpm}',
    'assert.scn.moving_back': 'Car moves backwards',
    'assert.scn.engine_running': 'Engine running',
    'action.braking': 'Braking...',
    'log.scn.stopped_frame': 'Stopped at frame {f}',
    'assert.scn.stopped_state': 'Car entered STOPPED state',
    'assert.scn.zero_vel': 'Velocity is effectively zero',
    
    'action.hold_brake': 'Holding with brakes',
    'assert.dyn.brake_hold': 'Brakes hold car on slope',
    'action.release_brake': 'Releasing brakes (Neutral)',
    'log.dyn.rollback': 'Rollback V: {v} m/s',
    'assert.dyn.rollback': 'Gravity causes rollback',
    'log.dyn.climb': 'Climb V: {v} m/s',
    'assert.dyn.climb': 'Car climbs slope',
    'action.shifting_1_2': 'Shifting 1->2',
    'log.dyn.jerk': 'Max Jerk: {j}',
    'assert.dyn.shock': 'Shift shock constrained by effective mass smoothing (<150)',
    'log.dyn.yaw': 'Actual Yaw: {r}, Kinematic: {k}',
    'assert.dyn.kinematic': 'Matches kinematic model at low speed',
    'log.dyn.coast': 'Start V: {v1}, End V: {v2}, Decel: {d} m/s^2',
    'assert.dyn.decel': 'Car decelerates',
    'assert.dyn.decel_perceptible': 'Deceleration is perceptible (>0.5 m/s^2)',
    'assert.dyn.decel_gentle': 'Deceleration is not violent (<3.0 m/s^2)',
  }
};

const LanguageContext = createContext<LanguageContextType | undefined>(undefined);

export const LanguageProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [language, setLanguage] = useState<Language>('zh-CN');

  const t = (key: string, params?: Record<string, string | number>): string => {
    let text = translations[language][key] || key;
    if (params) {
      Object.entries(params).forEach(([k, v]) => {
        text = text.replace(`{${k}}`, String(v));
      });
    }
    return text;
  };

  return (
    <LanguageContext.Provider value={{ language, setLanguage, t }}>
      {children}
    </LanguageContext.Provider>
  );
};

export const useLanguage = () => {
  const context = useContext(LanguageContext);
  if (!context) {
    throw new Error('useLanguage must be used within a LanguageProvider');
  }
  return context;
};
