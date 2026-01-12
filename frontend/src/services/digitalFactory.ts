import request from '@/utils/request'

// 本日工序合格率数据
export interface QualificationRateData {
  name: string
  value: number
  max: number
}

// 产品合格率数据
export interface ProductQualificationData {
  date: string
  productionCount: number
  qualificationRate: number
  productionValue: number
}

// 仓库存料数据
export interface WarehouseInventoryData {
  year: string
  quantity: number
}

// 产线异常信息数据
export interface ProductionLineExceptionData {
  year: string
  outputValue: string
  perCapitaOutput: number
  employeeCount: string
}

// 产量完成概览数据
export interface ProductionOverviewData {
  name: string
  plan: number
  actual: number
  completion: number
}

// 产品产量趋势数据
export interface ProductTrendData {
  date: string
  value: number
}

export const digitalFactoryService = {
  // 获取本日工序合格率数据
  getQualificationRate: async () => {
    const response = await request.get('/api/v1/digital-factory/qualification-rate')
    return response.data
  },

  // 获取产品合格率数据
  getProductQualification: async () => {
    const response = await request.get('/api/v1/digital-factory/product-qualification')
    return response.data
  },

  // 获取仓库存料数据
  getWarehouseInventory: async () => {
    const response = await request.get('/api/v1/digital-factory/warehouse-inventory')
    return response.data
  },

  // 获取产线异常信息数据
  getProductionLineException: async () => {
    const response = await request.get('/api/v1/digital-factory/production-line-exception')
    return response.data
  },

  // 获取产量完成概览数据
  getProductionOverview: async (period: '日' | '周' | '月') => {
    const response = await request.get('/api/v1/digital-factory/production-overview', {
      params: { period }
    })
    return response.data
  },

  // 获取产品A产量趋势
  getProductATrend: async (period: '日' | '周' | '月') => {
    const response = await request.get('/api/v1/digital-factory/product-a-trend', {
      params: { period }
    })
    return response.data
  },

  // 获取产品B产量趋势
  getProductBTrend: async (period: '日' | '周' | '月') => {
    const response = await request.get('/api/v1/digital-factory/product-b-trend', {
      params: { period }
    })
    return response.data
  },
}
