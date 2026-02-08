import React from 'react';
import { Qwen, Doubao, DeepSeek, Minimax, Gemini, Zhipu } from '@lobehub/icons';
import { AIVendor } from '../types';


export const VENDORS: AIVendor[] = [
  { 
    id: 'qwen', 
    name: '通义千问', 
    icon: <Qwen.Color className="w-full h-full" />, 
    color: '#615ced', 
    defaultBaseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1' 
  },
  { 
    id: 'doubao', 
    name: '豆包', 
    icon: <Doubao.Color className="w-full h-full" />, 
    color: '#045cfc', 
    defaultBaseUrl: 'https://ark.cn-beijing.volces.com/api/v3' 
  },
  { 
    id: 'deepseek', 
    name: 'DeepSeek', 
    icon: <DeepSeek.Color className="w-full h-full" />, 
    color: '#4d6bfe', 
    defaultBaseUrl: 'https://api.deepseek.com' 
  },
  { 
    id: 'minimax', 
    name: 'MiniMax', 
    icon: <Minimax.Color className="w-full h-full" />, 
    color: '#ec3833', 
    defaultBaseUrl: 'https://api.minimax.chat/v1' 
  },
  { 
    id: 'gemini', 
    name: 'Gemini', 
    icon: <Gemini.Color className="w-full h-full" />, 
    color: '#1ca2f1', 
    defaultBaseUrl: 'https://generativelanguage.googleapis.com/v1beta' 
  },
  { 
    id: 'glm', 
    name: '智谱 GLM', 
    icon: <Zhipu.Color className="w-full h-full" />, 
    color: '#356df7', 
    defaultBaseUrl: 'https://open.bigmodel.cn/api/paas/v4' 
  },
];
