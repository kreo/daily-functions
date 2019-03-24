const { getUrl, isUrl } = require('@metascraper/helpers');
const readTimeEstimate = require('read-time-estimate');

const validatorTime = value => {
  if (!value) return false;
  return value.trim();
};

const wrapTime = rule => ({ htmlDom }) => {
  const value = rule(htmlDom);
  return validatorTime(value);
};

const validatorUrl = (value, url) => isUrl(value) && getUrl(url, value);

const wrapUrl = rule => ({ htmlDom, url }) => {
  const value = rule(htmlDom);
  return validatorUrl(value, url);
};

const validatorTwitterHandle = value => {
  if (!value || value[0] !== '@') return false;
  return value;
};

const wrapTwitterHandle = rule => ({ htmlDom }) => {
  const value = rule(htmlDom);
  return validatorTwitterHandle(value);
};

const validatorTags = values => values.map(v => v.toLowerCase().trim().replace(/ /g, '-'));

const validatorKeywords = value => {
  if (!value || value.indexOf(',') < 0) return false;
  return validatorTags(value.split(','));
};

const wrapDevToTags = rule => ({ htmlDom }) => {
  const values = rule(htmlDom).map(t => t.replace('#', ''));
  if (!values.length) return false;
  return validatorTags(values);
};

const wrapMediumTags = rule => ({ htmlDom }) => {
  try {
    const script = rule(htmlDom);
    const json = JSON.parse(script);
    if (!json || !json.keywords || !json.keywords.filter) return false;
    return validatorTags(json.keywords.filter(t => t.indexOf('Tag:') > -1).map(t => t.replace('Tag:', '')));
  } catch (ex) {
    return false;
  }
};

const wrapKeywords = rule => ({ htmlDom }) => {
  const value = rule(htmlDom);
  return validatorKeywords(value);
};

const wrapReadTime = rule => ({ htmlDom }) => {
  const element = rule(htmlDom);
  if (element) {
    return readTimeEstimate.default(element);
  }
  return false;
};

module.exports = () => {
  return ({
    modified: [
      wrapTime($ => $('meta[property="article:modified_time"]').attr('content')),
    ],
    image: [
      wrapUrl($ => $('meta[property="og:image:secure_url"]').attr('content')),
      wrapUrl($ => $('meta[property="og:image:url"]').attr('content')),
      wrapUrl($ => $('meta[property="og:image"]').attr('content')),
      wrapUrl($ => $('meta[name="twitter:image:src"]').attr('content')),
      wrapUrl($ => $('meta[name="twitter:image"]').attr('content')),
      wrapUrl($ => $('meta[itemprop="image"]').attr('content')),
    ],
    siteTwitter: [
      wrapTwitterHandle($ => $('meta[name="twitter:site"]').attr('content')),
    ],
    creatorTwitter: [
      wrapTwitterHandle($ => $('meta[name="twitter:creator"]').attr('content')),
    ],
    keywords: [
      wrapDevToTags($ => $('.tags > .tag').toArray().map(el => $(el).text())),
      wrapMediumTags($ => $('script[type="application/ld+json"]').html()),
      wrapKeywords($ => $('meta[name="keywords"]').attr('content')),
    ],
    readTime: [
      wrapReadTime($ => $('.article__data').html()),
      wrapReadTime($ => $('.article-content').html()),
      wrapReadTime($ => $('.uni-paragraph').html()),
      wrapReadTime($ => $('.episode-body-summary').html()),
      wrapReadTime($ => $('article').html()),
      wrapReadTime($ => $('#readme').html()),
      wrapReadTime($ => $('.post__content').html()),
    ],
  });
};
