import { Request, Response } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';

const fileFilter = (req: Request, file: Express.Multer.File, cb: multer.FileFilterCallback) => {
    if (
        file.mimetype.startsWith('image/') ||
        file.mimetype.startsWith('video/') ||
        file.mimetype === 'application/pdf'
    ) {
        cb(null, true);
    } else {
        cb(null, false);
    }
};

const getValidatedDirectory = (req: Request): string => {
    const dirHeader = req.header('X-Asset-Directory');
    if (!dirHeader) return '';

    const safeDir = path.normalize(dirHeader).replace(/^([/\\])+|([/\\])+$/g, '');
    if (safeDir.includes('..') || safeDir.includes(path.sep + '.') || safeDir === '') {
        throw new Error('Diretório inválido.');
    }
    return safeDir;
};

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        let uploadPath = path.join(__dirname, '../assets/uploads');
        try {
            const dir = getValidatedDirectory(req);
            if (dir) {
                uploadPath = path.join(uploadPath, dir);
            }
        } catch (e) {
            return cb(new Error('Diretório inválido no header X-Asset-Directory'), '');
        }
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
    let assetUrl: string;
    try {
        const dir = getValidatedDirectory(req);
        assetUrl = dir
            ? `${req.protocol}://${req.get('host')}/assets/uploads/${dir}/${req.file.filename}`
            : `${req.protocol}://${req.get('host')}/assets/uploads/${req.file.filename}`;
    } catch (e) {
        return res.status(400).json({ message: 'Diretório inválido no header X-Asset-Directory.' });
    }
    return res.status(201).json({
        message: 'Asset salvo com sucesso!',
        url: assetUrl
    });
};

export const deleteAsset = async (req: Request, res: Response): Promise<Response> => {
    const { filename } = req.params;
    let assetPath = path.join(__dirname, '../assets/uploads');
    try {
        const dir = getValidatedDirectory(req);
        if (dir) {
            assetPath = path.join(assetPath, dir, filename);
        } else {
            assetPath = path.join(assetPath, filename);
        }
        await fs.promises.access(assetPath, fs.constants.F_OK);
        await fs.promises.unlink(assetPath);
        return res.status(200).json({ message: `Asset ${filename} deletado com sucesso.` });
    } catch (err: any) {
        if (err.message === 'Diretório inválido.') {
            return res.status(400).json({ message: 'Diretório inválido no header X-Asset-Directory.' });
        }
        if (err.code === 'ENOENT') {
            return res.status(404).json({ message: 'Asset não encontrado.' });
        }
        console.error(err);
        return res.status(500).json({ message: 'Erro ao deletar o asset.' });
    }
};

export const listAssets = async (req: Request, res: Response): Promise<Response> => {
    let assetsDir = path.join(__dirname, '../assets/uploads');
    try {
        const dir = getValidatedDirectory(req);
        if (dir) {
            assetsDir = path.join(assetsDir, dir);
        }
        const files = await fs.promises.readdir(assetsDir);
        const page = parseInt(req.query.page as string) || 1;
        const limit = parseInt(req.query.limit as string) || 10;
        const startIndex = (page - 1) * limit;
        const endIndex = page * limit;
        const paginatedFiles = files.slice(startIndex, endIndex);
        const assets = paginatedFiles.map(file => ({
            filename: file,
            url: dir
                ? `${req.protocol}://${req.get('host')}/assets/uploads/${dir}/${file}`
                : `${req.protocol}://${req.get('host')}/assets/uploads/${file}`
        }));
        const responseData = {
            totalAssets: files.length,
            currentPage: page,
            totalPages: Math.ceil(files.length / limit),
            assets: assets
        };
        return res.status(200).json(responseData);
    } catch (err: any) {
        if (err.message === 'Diretório inválido.') {
            return res.status(400).json({ message: 'Diretório inválido no header X-Asset-Directory.' });
        }
        if (err.code === 'ENOENT') {
            return res.status(404).json({ message: 'Diretório não encontrado.' });
        }
        console.error(err);
        return res.status(500).json({ message: 'Erro ao listar os assets.' });
    }
};
