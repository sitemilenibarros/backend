import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        const uploadPath = path.join(__dirname, '../assets/uploads');
        if (!fs.existsSync(uploadPath)) {
            fs.mkdirSync(uploadPath, { recursive: true });
        }
        cb(null, uploadPath);
    },
    filename: (req, file, cb) => {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        cb(null, uniqueSuffix + path.extname(file.originalname));
    }
});

export const upload = multer({
    storage: storage,
    fileFilter: fileFilter,
    limits: {
        fileSize: 1024 * 1024 * 50 // 50MB
    }
});

export const uploadAsset = async (req: Request, res: Response): Promise<Response> => {
    if (!req.file) {
        return res.status(400).json({ message: 'Nenhum arquivo de imagem ou vídeo enviado.' });
    }

    const assetUrl = `${req.protocol}://${req.get('host')}/assets/uploads/${req.file.filename}`;

    return res.status(201).json({
        message: 'Asset salvo com sucesso!',
        url: assetUrl
    });
};

export const deleteAsset = async (req: Request, res: Response): Promise<Response> => {
    const { filename } = req.params;
    const assetPath = path.join(__dirname, '../assets/uploads', filename);

    try {
        await fs.promises.access(assetPath, fs.constants.F_OK);
        await fs.promises.unlink(assetPath);
        return res.status(200).json({ message: `Asset ${filename} deletado com sucesso.` });
    } catch (err: any) {
        if (err.code === 'ENOENT') {
            return res.status(404).json({ message: 'Asset não encontrado.' });
        }
        console.error(err);
        return res.status(500).json({ message: 'Erro ao deletar o asset.' });
    }
};

export const listAssets = async (req: Request, res: Response): Promise<Response> => {
    const assetsDir = path.join(__dirname, '../assets/uploads');

    try {
        const files = await fs.promises.readdir(assetsDir);
        const assets = files.map(file => ({
            filename: file,
            url: `${req.protocol}://${req.get('host')}/assets/uploads/${file}`
        }));

        return res.status(200).json(assets);
    } catch (err) {
        console.error(err);
        return res.status(500).json({ message: 'Erro ao listar os assets.' });
    }
}