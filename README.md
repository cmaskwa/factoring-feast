# 🦃 The Great Thanksgiving Factoring Feast

An interactive game where students factor cubic and quartic polynomials to cook a Thanksgiving dinner.
Each correctly factored polynomial puts a dish on the table. There are 12 dishes in all.

## What's in the game

There are **12 dishes**, and each dish is a different *type* of problem. Each dish has a **question bank**
(1,111 questions in all), and every student gets a random question from the bank for each dish.
So students sitting next to each other get different problems.
A student keeps the same question for a dish even if they refresh the page or come back later.

| # | Dish | Pattern (complete factorization) | Example | Questions in bank |
|---|------|-----------|------|------|
| Q1 | Dinner Rolls | (x + a)(x² + b), cubic by grouping | x³ + 5x² + 2x + 10 | 100 |
| Q2 | Cranberry Sauce | (x − a)(x² + b), cubic by grouping | x³ − 4x² + 3x − 12 | 100 |
| Q3 | Corn on the Cob | (x² + a)(x² + b), quadratic form | x⁴ + 7x² + 12 | 100 |
| Q4 | Mashed Potatoes | (x + a)(x − b)(x + b), grouping then **difference of squares** | x³ + 3x² − 4x − 12 | 99 |
| Q5 | Green Bean Casserole | (x − a)(x − b)(x + b), grouping then **difference of squares** | x³ − 2x² − 9x + 18 | 99 |
| Q6 | Turkey Gravy | p²x⁴ − q², a difference of squares (about 1 in 5 must be factored a second time) | x⁴ − 16 | 77 |
| Q7 | Mac & Cheese | (x² + a)(x² − b), b not a perfect square, so stop at two factors | x⁴ + 3x² − 10 | 99 |
| Q8 | Stuffing | (cx + a)(x − b)(x + b), grouping with leading coefficient > 1, then **difference of squares** | 2x³ + 3x² − 8x − 12 | 100 |
| Q9 | Sweet Potato Casserole | (x ± a)(cx − b)(cx + b), grouping then **difference of squares** | 4x³ − 12x² − x + 3 | 100 |
| Q10 | Apple Pie | (x − a)(x + a)(x − b)(x + b), quadratic form then **two differences of squares** | x⁴ − 5x² + 4 | 58 |
| Q11 | Pumpkin Pie | (x² + a)(x − b)(x + b), quadratic form then **difference of squares** | x⁴ − 13x² + 36 | 94 |
| Q12 | Roast Turkey | (px − q)(px + q)(x − r)(x + r), quadratic form with leading coefficient > 1 | 4x⁴ − 37x² + 9 | 85 |

**Answer key:** [`question-bank.csv`](question-bank.csv) lists every question with its complete factorization.
To view it, open it in Google Sheets (*File → Import → Upload*).
In your results sheet, hover over a student's **Attempts** cell to see which question they got.

A few dishes have fewer than 100 questions. For those types, going higher would mean constants in the thousands.

To change the question bank, edit `tools/generate-bank.js` and run `node tools/generate-bank.js`.
This rebuilds the bank inside `index.html` and the CSV answer key.

* **Answer checking:** the game multiplies the student's answer back out and also checks that it is factored **completely**.
  If a student stops at `(x+3)(x^2-4)`, they get a message that `x² − 4` is a difference of two squares and they need to keep factoring.
  Any order of factors is accepted.
* **Hints:** each question has 2 hints made for that exact problem. The second hint shows the grouping or substitution step.
* **📖 Cookbook tab:** worked examples of factoring by grouping (a cubic) and quadratic form (a quartic). Both end with a difference of squares.
* Progress is also saved in the student's browser, so refreshing the page doesn't lose their work.

## Hooking it up to your Google Sheet (about 5 minutes)

The sheet gets **one row per student**. The student name is in column A, then two columns for each question:

| Student Name | Q1 Dinner Rolls – Attempts | Q1 Dinner Rolls – Accuracy | Q2 … | … | Dishes Cooked | Total Attempts | Overall Accuracy | Last Updated |
|---|---|---|---|---|---|---|---|---|
| Jordan Rivera | 1 | 100% | 3 | 33% | … | 7 | 12 | 58% | 11/20 10:14 AM |

* **Attempts** = how many answers the student has submitted for that question. Typos that can't be read, like a missing parenthesis, don't count.
* **Accuracy** = 1 correct ÷ attempts. Correct on the 1st try = 100%, on the 2nd try = 50%, and so on. Attempted but not solved yet = 0%. Blank = not tried yet.
* The row updates live every time the student submits an answer.

### Steps

1. Open (or create) the Google Sheet you want to use.
2. Click **Extensions → Apps Script**.
3. Delete whatever code is there, paste in the full contents of [`apps-script/Code.gs`](apps-script/Code.gs), and click **Save** 💾.
4. Click **Deploy → New deployment**. Click the gear ⚙️ next to "Select type" and choose **Web app**.
   * **Execute as:** *Me*
   * **Who has access:** *Anyone* (students don't need to sign in. Only the game can write to the sheet, and nobody can read it through this link.)
5. Click **Deploy**. Google will ask you to authorize the script (choose your account → *Advanced* → *Go to project* → *Allow*).
6. Copy the **Web app URL** (it ends in `/exec`).
7. Open `index.html`, find this line near the top, and paste your URL between the quotes:
   ```js
   window.FEAST_SHEET_URL = "https://script.google.com/macros/s/XXXXXXXX/exec";
   ```
   *Or* skip editing the file and give students a link with the URL attached:
   `…/index.html?sheet=https://script.google.com/macros/s/XXXXXXXX/exec`

A tab called **Feast Results** is created in your sheet automatically the first time a student starts the game.

> If you change `Code.gs` later, use **Deploy → Manage deployments → ✏️ Edit → Version: New version** so the URL stays the same.

## Getting the game to students

The game is a single file (`index.html`) with no installation needed. Some options:

* **GitHub Pages:** in this repo go to *Settings → Pages* and deploy from the branch. Students then open `https://<your-username>.github.io/factoring-feast/`.
* Upload `index.html` to Google Classroom / Drive and have students download and open it in Chrome.
