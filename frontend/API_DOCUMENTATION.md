# 数字工厂 API 接口文档

本文档描述了数字工厂页面所需的后端API接口。

## 基础URL
所有接口的基础路径为: `/api/v1/digital-factory`

## 接口列表

### 1. 获取本日工序合格率数据
**接口地址**: `GET /api/v1/digital-factory/qualification-rate`

**请求参数**: 无

**响应数据**:
```json
[
  {
    "name": "检验1",
    "value": 85,
    "max": 100
  },
  {
    "name": "检验2",
    "value": 60,
    "max": 100
  },
  {
    "name": "检验3",
    "value": 70,
    "max": 100
  }
]
```

### 2. 获取产品合格率数据
**接口地址**: `GET /api/v1/digital-factory/product-qualification`

**请求参数**: 无

**响应数据**:
```json
[
  {
    "date": "10/01",
    "productionCount": 320,
    "qualificationRate": 95.5,
    "productionValue": 400
  },
  {
    "date": "10/02",
    "productionCount": 350,
    "qualificationRate": 96.2,
    "productionValue": 420
  }
]
```

### 3. 获取仓库存料数据
**接口地址**: `GET /api/v1/digital-factory/warehouse-inventory`

**请求参数**: 无

**响应数据**:
```json
[
  {
    "year": "2020",
    "quantity": 600
  },
  {
    "year": "2021",
    "quantity": 700
  },
  {
    "year": "2022",
    "quantity": 550
  }
]
```

### 4. 获取产线异常信息数据
**接口地址**: `GET /api/v1/digital-factory/production-line-exception`

**请求参数**: 无

**响应数据**:
```json
[
  {
    "year": "2025",
    "outputValue": "30亿",
    "perCapitaOutput": 1000,
    "employeeCount": "1万"
  },
  {
    "year": "2024",
    "outputValue": "40亿",
    "perCapitaOutput": 1200,
    "employeeCount": "2万"
  }
]
```

### 5. 获取产量完成概览数据
**接口地址**: `GET /api/v1/digital-factory/production-overview`

**请求参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| period | string | 是 | 时间周期: "日", "周", "月" |

**响应数据**:
```json
[
  {
    "name": "产品A",
    "plan": 1007,
    "actual": 907,
    "completion": 90
  },
  {
    "name": "产品B",
    "plan": 1007,
    "actual": 907,
    "completion": 85
  }
]
```

### 6. 获取产品A产量趋势
**接口地址**: `GET /api/v1/digital-factory/product-a-trend`

**请求参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| period | string | 是 | 时间周期: "日", "周", "月" |

**响应数据**:
```json
[
  {
    "date": "10/01",
    "value": 650
  },
  {
    "date": "10/02",
    "value": 780
  },
  {
    "date": "10/03",
    "value": 520
  }
]
```

### 7. 获取产品B产量趋势
**接口地址**: `GET /api/v1/digital-factory/product-b-trend`

**请求参数**:
| 参数名 | 类型 | 必填 | 说明 |
|--------|------|------|------|
| period | string | 是 | 时间周期: "日", "周", "月" |

**响应数据**:
```json
[
  {
    "date": "10/01",
    "value": 450
  },
  {
    "date": "10/02",
    "value": 580
  },
  {
    "date": "10/03",
    "value": 420
  }
]
```

## 响应格式说明

所有接口的成功响应都应该遵循以下格式:

```json
{
  "code": 200,
  "message": "success",
  "data": [/* 具体数据 */]
}
```

错误响应格式:

```json
{
  "code": 400/401/403/404/500,
  "message": "错误信息",
  "data": null
}
```

## 认证说明

所有接口都需要在请求头中携带认证token:

```
Authorization: Bearer <token>
```

## 注意事项

1. 所有日期格式统一使用 `MM/DD` 格式 (如: "10/01")
2. 产量值为整数，合格率为百分比数值 (如: 95.5 表示 95.5%)
3. 时间周期参数为中文: "日", "周", "月"
4. 接口需要支持跨域请求(CORS)
5. 建议实现数据缓存机制以提高性能

## 前端使用示例

```typescript
// 获取产量完成概览数据
const data = await digitalFactoryService.getProductionOverview('日')

// 获取产品A趋势数据
const trendData = await digitalFactoryService.getProductATrend('周')
```
