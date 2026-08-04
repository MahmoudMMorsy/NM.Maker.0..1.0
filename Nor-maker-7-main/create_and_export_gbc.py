import asyncio
import os
from playwright.async_api import async_playwright

async def run():
    async with async_playwright() as p:
        browser = await p.chromium.launch(headless=True)
        page = await browser.new_page()

        await page.goto('http://localhost:3000')
        await page.wait_for_load_state('networkidle')

        await page.click('text=Manual Project')
        await page.click('text=Mega Action')
        await page.click('text=Create Project')
        await page.wait_for_timeout(3000)

        async with page.expect_download() as download_info:
            await page.click('text=Export as GBC ROM (.gbc)')

        download = await download_info.value
        path = os.path.join(os.getcwd(), "mega_action_game_v2.gbc")
        await download.save_as(path)
        print(f"Game exported to: {path}")
        await browser.close()

if __name__ == "__main__":
    asyncio.run(run())
