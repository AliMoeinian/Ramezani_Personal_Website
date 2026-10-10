# جاده‌ی شکوفایی · Elham Ramezani

A Persian, right-to-left personal website for Elham Ramezani, built with HTML, CSS, JavaScript, and original SVG artwork. The application has no build step, runtime packages, external fonts, analytics, cookies, or backend.

## Run locally

From this repository, run:

```sh
npm start
```

This serves the site on port **3000** using Python 3, both at `/` and `/Ramezani_Personal_Website/`, so the published Pages paths can also be tested locally. Alternatively, run `python3 scripts/serve.py --port 3000`. Use an HTTP server rather than opening HTML files directly; JavaScript modules and SVG loading require HTTP.

Run the booking and calendar tests with Node 18 or newer (Node 24 was used during development):

```sh
npm test
```

No `npm install` is needed. Fonts are already included, along with their OFL licenses. In this cloud environment, Playwright and Chromium are also available for `node tests/browser.cjs` and `node tests/booking-browser.cjs`; these optional checks require the server to be running.

## Pages and features

- `index.html`: seven stations, illustrated garden, scroll-following butterfly, irreversible flower growth, services filters, consultation process, credibility, booking, and contact.
- `career/index.html`: résumé, with keyboard-accessible tabs and direct links such as `career/#experience`. Printing includes every section. `career.html` is also available for file-based static hosting.
- `404.html`: a friendly return-home page.
- Mobile navigation uses a modal bottom sheet, and selected appointments have a bottom booking panel.
- System reduced-motion preferences and the footer toggle stop decorative motion. Low-resource devices use a simpler mode. Animation pauses outside visible areas or when the tab is hidden.

## ویرایش برای علی و الهام

### متن و اطلاعات

فایل `assets/js/config.js` را باز کنید. این‌ها بخش‌های اصلی هستند:

| برای تغییر | بخش تنظیمات |
|---|---|
| شعار، نام و عنوان | `site` |
| معرفی، ویژگی‌ها، خدمات و مراحل | `content` |
| آیدی تلگرام، اینستاگرام و ایمیل | `contact` |
| عبارت و شماره‌ی عضویت | `license` |
| آدرس حضوری | `address` |
| توضیح پرداخت | `payment` |
| ساعت‌ها و تعداد هفته‌ها | `booking` |
| نمایش قیمت و قانون جابه‌جایی | `flags` |

برای تغییر سوابق، `assets/js/career-data.js` را ویرایش کنید. متن جایگزین عکس، گل تصویرسازی‌شده است؛ عکس واقعی هنوز ارائه نشده. متن‌های اولیه در HTML هم وجود دارند تا بدون جاوااسکریپت قابل خواندن باشند. اگر متن نهایی را تغییر دادید، متن اولیه‌ی همان بخش در HTML را نیز به‌روز کنید تا تجربه‌ی بدون جاوااسکریپت و موتورهای جست‌وجو هماهنگ بماند.

### اتصال زمان‌های رزرو

در Google Sheets، فقط این چهار ستون را بسازید:

```csv
تاریخ,ساعت,وضعیت,نوع
۱۴۰۵/۸/۴,۱۶:۰۰,پر,
۱۴۰۵/۸/۷,,مسدود,
۱۴۰۵/۸/۱۱,۲۰:۳۰,باز,آنلاین
```

برگه را با فرمت CSV در وب منتشر کنید، انتشار مجدد خودکار را فعال کنید و لینک HTTPS منتشرشده را در `booking.sheetCsvUrl` قرار دهید. فقط زمان‌های پر یا مسدود و زمان‌های اضافه در شیت ثبت می‌شوند. بدون ساعت، «مسدود» کل روز را می‌بندد. برای ساعت اضافه‌ی «باز»، نوع «آنلاین» یا «حضوری» را بنویسید.

ارقام فارسی، عربی و انگلیسی پشتیبانی می‌شوند. تمام ساعت‌ها به وقت تهران‌اند؛ زمان‌های گذشته و زمان‌هایی که کمتر از ۱۲ ساعت به آن‌ها مانده حذف می‌شوند. جدول چهار بازه‌ی هفت‌روزه از امروز را نمایش می‌دهد.

**هیچ اطلاعات شخصی مراجع در شیت عمومی نگذارید.** اگر شیت خالی، خراب یا غیرقابل‌دسترسی باشد، سایت همچنان کار می‌کند و وضعیت ساعت‌ها را «نامشخص» نشان می‌دهد. درخواست تنها بعد از تأیید الهام قطعی است.

برای جایگزین محلی، `sheetCsvUrl` را خالی بگذارید و `availabilityJsonUrl` را روی `new URL('../../availability.json', import.meta.url).href` تنظیم کنید. در `availability.json` از این قالب استفاده کنید:

```json
[
  { "date": "1405/8/4", "time": "16:00", "status": "full" },
  { "date": "1405/8/7", "time": "", "status": "blocked" },
  { "date": "1405/8/11", "time": "20:30", "status": "open", "type": "online" }
]
```

در صورت استفاده از شیت، رفتار CORS و دسترسی از اینترنت ایران باید با لینک واقعی بررسی شود. هیچ لینک شیت فعالی در نسخه‌ی فعلی ارائه نشده است.

### انتشار

سایت اکنون **نسخه‌ی نمایشی** است؛ `isDraft: true`، متای `noindex` و `robots.txt` مانع درخواست ایندکس هستند.

انتشار نسخه‌ی نمایشی برای بررسی ظاهر سایت مجاز است؛ نوار نسخه‌ی نمایشی و `noindex` تا تأیید اطلاعات فعال می‌مانند. آدرس GitHub Pages در `site.url` تنظیم شده است:

`https://alimoeinian.github.io/Ramezani_Personal_Website/`

ورک‌فلو `.github/workflows/pages.yml` با هر push به `main`، تست‌ها را اجرا می‌کند و فقط فایل‌های وب را منتشر می‌کند. در تنظیمات ریپو، `Settings → Pages → Build and deployment → Source` را روی **GitHub Actions** قرار دهید. اگر اجرای اولیه پیش از فعال کردن Pages ناموفق بود، در تب Actions ورک‌فلو **Deploy website to GitHub Pages** را دوباره اجرا کنید. نیازی به نصب بسته یا وارد کردن secret جدید نیست.

مسیر `career/` با میزبانی در زیردایرکتوری ریپو نیز کار می‌کند. در صورت تغییر دامنه، `site.url` را تغییر دهید و ابزار متادیتا را اجرا کنید.

پیش از انتشار نهایی:

- آیدی‌ها، ایمیل، عضویت، آدرس فرضی، متن پرداخت، ساعت‌ها و سوابق علامت‌خورده را تأیید کنید.
- عکس واقعی را در صورت نیاز اضافه کنید و متادیتای مکانی آن را حذف کنید.
- اتصال واقعی شیت و درخواست تلگرام را با گوشی و مرورگر داخل برنامه‌ها بررسی کنید.
- `site.url` را به آدرس واقعی و نهایی سایت تنظیم کنید. سپس ابزار متادیتا را اجرا کنید: `node scripts/prepare-metadata.js`.
- پس از تأیید همه‌ی اطلاعات، `flags.isDraft` را `false` کنید و دوباره ابزار متادیتا را اجرا کنید. این ابزار متای ایندکس، canonical، تصاویر اشتراک‌گذاری، `robots.txt` و `sitemap.xml` را هماهنگ می‌کند.
- اگر دامنه‌ی اختصاصی دارید، فایل `CNAME` و تنظیمات Pages/DNS/HTTPS را پس از مشخص شدن دامنه اضافه کنید.

تنظیم دامنه‌ی اختصاصی و DNS جزو این ورک‌فلو نیست.

## Validation

See `docs/qa.md` for checks performed, their scope, and remaining real-device and network checks. The source specification describes a separate Claude Code agent workflow; its execution prompts were treated as document content. This implementation was built in the existing cloud checkout.
