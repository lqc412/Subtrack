import * as subsService from '../services/subsServices.js'

export const getSubs = async (req, res) => {
    try {
        const subs = await subsService.getSubs();
        res.status(200).json(subs);
    } catch (error) { 
        console.error('Error fetching subs', error);
        res.status(500).json({message: 'Internal Server Error'})
    }
}

export const createSubs = async (req, res) => {
    try {
        const subsData = req.body;
        const newSubs = await subsService.createSubs(subsData);
        res.status(200).json(newSubs);
    } catch (error) { 
        console.error('Error fetching subs', error);
        res.status(500).json({message: 'Internal Server Error'})
    }
}

export const updateSubs = async (req, res) => {
    try {
        const subsId = parseInt(req.params.id);
        const subsData = req.body;
        const updatedsubs = await subsService.updateSubs(subsData, subsId);
        if (!updateSubs) {
            return res.status(404).json({ message: 'Subs not found' });
        }
        res.status(200).json(updatedsubs);

    } catch (error) { 
        console.error('Error updating subs:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};


export const deleteSubs = async (req, res) => {
    try {
        const subsId = req.params.id;
        const deleted = await subsService.deleteSubs(subsId);
        if (!deleted) {
        return res.status(404).json({ message: 'subs not found' });
        }

        res.status(200).send();

    } catch (error) { 
        console.error('Error deleting client:', error);
        res.status(500).json({ message: 'Internal Server Error' });
    }
};


export const searchSubs = async (req, res) => {
    try {
      const searchTerm = req.query.q;
      const subs = await subsService.searchSubs(searchTerm);
      res.status(200).json(subs);
    } catch (error) {
      console.error('Error searching subs:', error);
      res.status(500).json({ message: 'Internal Server Error' });
    }
};

