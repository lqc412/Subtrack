// src/controllers/subsController.js
import * as subsService from '../services/subsServices.js'

export const getSubs = async (req, res) => {
    try {
        // 获取认证用户的ID
        const userId = req.user.id;
        // 获取该用户的订阅
        const subs = await subsService.getSubs(userId);
        res.status(200).json(subs);
    } catch (error) { 
        console.error('获取订阅出错', error);
        res.status(500).json({message: '服务器内部错误'})
    }
}

export const createSubs = async (req, res) => {
    try {
        // 获取认证用户的ID
        const userId = req.user.id;
        // 添加用户ID到订阅数据
        const subsData = { ...req.body, user_id: userId };
        const newSubs = await subsService.createSubs(subsData);
        res.status(200).json(newSubs);
    } catch (error) { 
        console.error('创建订阅出错', error);
        res.status(500).json({message: '服务器内部错误'})
    }
}

export const updateSubs = async (req, res) => {
    try {
        const userId = req.user.id;
        const subsId = parseInt(req.params.id);
        
        // 检查订阅是否属于该用户
        const subscription = await subsService.getSubById(subsId);
        if (!subscription) {
            return res.status(404).json({ message: '订阅未找到' });
        }
        
        if (subscription.user_id !== userId) {
            return res.status(403).json({ message: '没有权限修改此订阅' });
        }
        
        const subsData = req.body;
        const updatedSubs = await subsService.updateSubs(subsData, subsId);
        
        if (!updatedSubs) {
            return res.status(404).json({ message: '订阅未找到' });
        }
        
        res.status(200).json(updatedSubs);
    } catch (error) { 
        console.error('更新订阅出错:', error);
        res.status(500).json({ message: '服务器内部错误' });
    }
};

export const deleteSubs = async (req, res) => {
    try {
        const userId = req.user.id;
        const subsId = req.params.id;
        
        // 检查订阅是否属于该用户
        const subscription = await subsService.getSubById(subsId);
        if (!subscription) {
            return res.status(404).json({ message: '订阅未找到' });
        }
        
        if (subscription.user_id !== userId) {
            return res.status(403).json({ message: '没有权限删除此订阅' });
        }
        
        const deleted = await subsService.deleteSubs(subsId);
        if (!deleted) {
            return res.status(404).json({ message: '订阅未找到' });
        }

        res.status(200).send();

    } catch (error) { 
        console.error('删除订阅出错:', error);
        res.status(500).json({ message: '服务器内部错误' });
    }
};

export const searchSubs = async (req, res) => {
    try {
      const userId = req.user.id;
      const searchTerm = req.query.q;
      const subs = await subsService.searchSubs(searchTerm, userId);
      res.status(200).json(subs);
    } catch (error) {
      console.error('搜索订阅出错:', error);
      res.status(500).json({ message: '服务器内部错误' });
    }
};