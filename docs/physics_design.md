
# ProDriver Lab Physics Design Document (v3.0)

本文档描述核心物理模块的状态机设计逻辑及关键参数说明。

## 1. Powertrain (Clutch Logic)

动力总成采用**基于扭矩的约束求解** (Torque-based Constraint Solver)。离合器并非简单的“连接/断开”，而是一个带有**滞回 (Hysteresis)** 的状态机。

### 状态定义
1.  **LOCKED (Stick)**: 引擎飞轮与变速箱输入轴完全同步。引擎惯量与车身惯量耦合。
2.  **SLIPPING (Slip)**: 存在转速差。传递扭矩 = 摩擦片正压力 * 摩擦系数 (Capacity)。
3.  **DISCONNECTED**: 空档或离合踏板完全踩下。无扭矩传递。

### 状态转移逻辑 (services/physics/powertrain.ts)

*   **进入 LOCKED 条件**:
    *   `TorqueDemand < Capacity * (1.0 - Hysteresis)`: 扭矩未超限。
    *   `RPM_Diff < 150`: 转速差足够小（Gatekeeper）。
    *   `RPM > Idle * 0.9`: 引擎转速健康（防止在熄火边缘强制锁止导致顿挫）。

*   **打破 LOCKED (进入 SLIP) 条件**:
    *   `TorqueDemand > Capacity * (1.0 + Hysteresis)`: 扭矩过载（如弹射起步或剧烈换挡）。
    *   `RPM < Idle * 0.6`: 防熄火机制（Anti-Stall/Anti-Lug），自动断开以保护引擎。

### 关键参数 (Magic Numbers)
| 参数/阈值 | 值 (Default) | 说明 |
| :--- | :--- | :--- |
| `clutchHysteresis` | 0.1 | 离合器锁止判断的缓冲区宽。防止在高频震荡时反复 Stick-Slip。 |
| `Gatekeeper RPM` | 150 | 允许进入锁止的最大转速差。值越小，锁止越平顺，但啮合时间变长。 |
| `Anti-Stall Ratio` | 0.6 | 引擎转速低于怠速的 60% 时，强制打滑离合器。 |

---

## 2. Idle Control (怠速控制器)

使用单环 PID 控制器维持引擎最低转速。

*   **输入**: `TargetRPM - CurrentRPM`
*   **输出**: 节气门开度偏移量 (Throttle Offset)
*   **特点**:
    *   使用 `Derivative on Measurement` (对测量值微分) 而非对误差微分，防止目标值改变时产生瞬间冲击（Setpoint Kick）。
    *   积分分离：当 `RPM > Target + 1500` 时重置积分项，防止积分饱和 (Windup)。

---

## 3. Chassis Stop State Machine (停车状态机)

为了解决低速积分不稳定（微小震荡）的问题，底盘引入了一个三态状态机来管理“完全停止”。

### 状态定义
1.  **MOVING**: 正常物理积分。
2.  **STOPPING**: 正在刹停过程中。此时会对制动力进行缩放 (Brake Scale) 以平滑最后 1m/s 的减速，防止“点头”效应。
3.  **STOPPED**: 物理积分暂停，强制速度与角速度为 0。

### 状态转移 (services/physics/chassis.ts -> updateStoppingState)

*   **MOVING -> STOPPING**:
    *   速度 < `vStopThreshold`
    *   并且正在刹车 (`brakeTorque > 10`)

*   **STOPPING -> STOPPED**:
    *   速度 < `vStopThreshold / 2`
    *   并且 `timer > minStopTime` (确保不是瞬间过零点)

*   **STOPPED -> MOVING**:
    *   `HoldCondition` 失效。
    *   `HoldCondition`: 最大静摩擦制动力 > (重力分量 + 引擎驱动力)。即：刹车踩得不够死，或者油门给太大，或者坡度太陡。

### 关键参数 (Config: feel)
| 参数 | 值 (Default) | 说明 |
| :--- | :--- | :--- |
| `vStopThreshold` | 0.1 m/s | 低于此速度开始尝试进入停止逻辑。 |
| `minStopTime` | 0.2 s | 必须在此速度下维持多久才判定为完全停止。 |
| `lowSpeedBlend` | 0.5 - 5.0 m/s | 在此区间内，物理计算从“纯运动学 (Kinematic)”过渡到“动力学 (Dynamic)”。低速侧重阿克曼几何，高速侧重轮胎侧偏。 |
