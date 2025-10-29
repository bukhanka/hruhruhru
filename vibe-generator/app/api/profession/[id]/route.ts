import { NextRequest, NextResponse } from 'next/server';
import { promises as fs } from 'fs';
import path from 'path';

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const { id } = params;
    
    // Путь к JSON файлу профессии
    const filePath = path.join(process.cwd(), 'data', 'professions', `${id}.json`);
    
    // Читаем файл
    const fileContent = await fs.readFile(filePath, 'utf-8');
    const data = JSON.parse(fileContent);
    
    return NextResponse.json(data);
  } catch (error: any) {
    console.error('Error loading profession:', error);
    
    if (error.code === 'ENOENT') {
      return NextResponse.json(
        { error: 'Profession not found' },
        { status: 404 }
      );
    }
    
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

