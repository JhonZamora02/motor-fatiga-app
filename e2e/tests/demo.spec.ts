import { test, expect } from '@playwright/test';
import path from 'path';

test.describe('Motor Fatiga Demo Standalone', () => {

  test('Debe cargar la página y realizar simulación exitosamente', async ({ page }) => {
    // Generar la ruta absoluta al demo.html
    // process.cwd() está en e2e/
    const filePath = `file:///${path.resolve(process.cwd(), '../demo.html').replace(/\\/g, '/')}`;
    await page.goto(filePath);

    // Verificar título
    await expect(page).toHaveTitle('Motor Inteligente de Fatiga · Demo');

    // Verificar que el estado vacío está visible al inicio
    await expect(page.locator('#emptyState')).toBeVisible();

    // Hacer clic en un preset
    await page.getByRole('button', { name: 'HIIT estándar' }).click();

    // Verificar que los inputs cambiaron (HIIT estándar es 40, 20, 5)
    await expect(page.locator('#workDuration')).toHaveValue('40');
    await expect(page.locator('#restDuration')).toHaveValue('20');
    await expect(page.locator('#rounds')).toHaveValue('5');

    // Simular fatiga
    await page.getByRole('button', { name: 'Simular fatiga →' }).click();

    // Verificar que el estado vacío desapareció y results es visible
    await expect(page.locator('#emptyState')).toBeHidden();
    await expect(page.locator('#results')).toBeVisible();

    // Verificar que las métricas tienen valores
    const fMax = await page.locator('#mFatigaMax').innerText();
    expect(fMax).not.toBe('—');
    expect(parseFloat(fMax)).toBeGreaterThan(0);
  });

  test('Debe poder usar el botón reiniciar', async ({ page }) => {
    const filePath = `file:///${path.resolve(process.cwd(), '../demo.html').replace(/\\/g, '/')}`;
    await page.goto(filePath);

    // Simular (usando valores por defecto)
    await page.getByRole('button', { name: 'Simular fatiga →' }).click();
    await expect(page.locator('#results')).toBeVisible();

    // Reiniciar
    await page.getByRole('button', { name: 'Reiniciar' }).click();

    // Verificar estado inicial
    await expect(page.locator('#results')).toBeHidden();
    await expect(page.locator('#emptyState')).toBeVisible();
    await expect(page.locator('#workDuration')).toHaveValue('40');
  });

});
