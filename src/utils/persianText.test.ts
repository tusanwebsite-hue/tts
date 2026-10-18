import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeChars, removeStutters, refinePersianText } from './persianText.ts';

test('normalizeChars converts Arabic yeh and kaf to Persian', () => {
  const input = 'كتاب يار';
  const expected = 'کتاب یار';
  assert.equal(normalizeChars(input), expected);
});

test('removeStutters removes accidental duplicate words', () => {
  const input = 'کافیه تو تو مرورگر فایرفاکس این متن رو جستجو کنین';
  const result = removeStutters(input);
  assert.equal(result.cleaned, 'کافیه تو مرورگر فایرفاکس این متن رو جستجو کنین');
  assert.equal(result.issues.length, 1);
  assert.equal(result.issues[0].original, 'تو تو');
  assert.equal(result.issues[0].fixed, 'تو');
});

test('refinePersianText fixes "هس" to "هست" and "شمام" to "شما هم"', () => {
  const raw = 'حتما شمام یه راهی هس';
  const res = refinePersianText(raw, { mode: 'fluent_colloquial' });
  assert.equal(res.refinedText, 'حتما شما هم یه راهی هست');
  assert.equal(res.detectedIssues.length >= 2, true);
});

test('refinePersianText calculates word count and estimated duration', () => {
  const text = 'یک دو سه چهار پنج';
  const res = refinePersianText(text, { mode: 'fluent_colloquial' });
  assert.equal(res.wordCount, 5);
  assert.equal(res.estimatedDurationSeconds > 0, true);
  assert.equal(res.sentences.length, 1);
});

test('refinePersianText handles the full prompt text with stutter and typos', () => {
  const fullText = `حتما شمام برا استفاده از جمینای و گوگل فلو یا ابزارهای هوش مصنوعی با مشکل وی پی ان روبرو شدین.
وی پی ان فروشا با قیمت خیلی بالا سرویسای مخصوص هوش مصنوعی رو میفروشن
ولی یه راهی هس که بتونین بدون هزینه یه وی پی ان آیپی تمیز رو مرورگر فایرفاکس نصب کنین و راحت ازش استفاده کنین

کافیه تو تو مرورگر فایرفاکس این متن رو جستجو کنین
بعد دنبال این گزینه بگردین و با این گزینه فعالش کنین
به همین راحتی
یه وی پی ان رایگان و پرسرعت براتون فعال شد
هر ماهم 50 گیگ حجم بهتون میده

اگه این پست برات مفیده ذخیره کن
اگه دوستات لازمش دارن براشون بفرست`;

  const res = refinePersianText(fullText, { mode: 'fluent_colloquial' });
  // 'تو تو' must be fixed to 'تو'
  assert.equal(res.refinedText.includes('تو تو'), false);
  assert.equal(res.refinedText.includes('تو مرورگر فایرفاکس'), true);
  // 'هس' must be fixed to 'هست'
  assert.equal(res.refinedText.includes('راهی هست'), true);
  // 'فروشا' must be 'فروش‌ها'
  assert.equal(res.refinedText.includes('فروش‌ها'), true);
  // 'سرویسای' must be 'سرویس‌های'
  assert.equal(res.refinedText.includes('سرویس‌های'), true);
  assert.equal(res.sentences.length > 5, true);
});
