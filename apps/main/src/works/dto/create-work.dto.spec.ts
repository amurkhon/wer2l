import { BadRequestException, ValidationPipe } from '@nestjs/common';
import { CreateWorkDto } from './create-work.dto';
import { UpdateWorkDto } from './update-work.dto';

// Mirrors the global pipe in main.ts.
const pipe = new ValidationPipe({
  whitelist: true,
  forbidNonWhitelisted: true,
  transform: true,
  transformOptions: { enableImplicitConversion: false },
});

// What the admin WorkForm submits for a paper with an uploaded PDF and no completion date.
const formValues = {
  title: 'Seismic Analysis',
  type: 'paper',
  paperUrl: '',
  pdfFile: '/uploads/2026/10/13ffb6aa-6fb9-4d2d-8091-80a45ff9e840-1-s2_0-paper.pdf',
  description: '',
  coverImage: '/uploads/2026/10/0b6c1f9e-2d7a-4c55-9a51-3f1f4c2b8e11-cover.png',
  status: 'published',
  completionDate: '',
  featured: false,
};

describe.each([
  ['CreateWorkDto', CreateWorkDto],
  ['UpdateWorkDto', UpdateWorkDto],
])('%s', (_name, metatype) => {
  const validate = (body: Record<string, unknown>) =>
    pipe.transform(body, { type: 'body', metatype });

  it('accepts a blank completion date as null so the date is stored empty or cleared', async () => {
    const dto = await validate({ ...formValues });
    expect(dto.completionDate).toBeNull();
  });

  it('still parses a real completion date', async () => {
    const dto = await validate({ ...formValues, completionDate: '2026-10-01' });
    expect(dto.completionDate).toEqual(new Date('2026-10-01'));
  });

  it('still rejects a malformed completion date', async () => {
    await expect(validate({ ...formValues, completionDate: 'not-a-date' })).rejects.toThrow(
      BadRequestException,
    );
  });
});
