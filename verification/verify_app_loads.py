from playwright.sync_api import sync_playwright

def verify_error_handling():
    with sync_playwright() as p:
        browser = p.chromium.launch(headless=True)
        page = browser.new_page()

        # Navigate to the app
        page.goto("http://localhost:3000")

        # Wait for the app to load
        page.wait_for_selector("text=TinyWiki")

        # Take a screenshot of the initial state
        page.screenshot(path="verification/initial_state.png")

        print("Initial state screenshot captured.")

        browser.close()

if __name__ == "__main__":
    verify_error_handling()
