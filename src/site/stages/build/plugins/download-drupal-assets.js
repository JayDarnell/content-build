/* eslint-disable no-param-reassign */
require('isomorphic-fetch');
const path = require('path');
const fs = require('fs-extra');
const chalk = require('chalk');

const { logDrupal: log } = require('../drupal/utilities-drupal');
const getDrupalClient = require('../drupal/api');

async function downloadFile(
  files,
  options,
  client,
  assetsToDownload,
  downloadResults,
  everythingDownloaded,
  downloaderIndex,
) {
  const asset = assetsToDownload.shift();
  if (!asset) {
    return;
  }
  const cacheOutputPath = path.join(
    options.cacheDirectory,
    'drupal/downloads',
    asset.dest,
  );

  const buildOutputPath = path.join('build', options.buildtype, asset.dest);

  const outputPaths = [cacheOutputPath, buildOutputPath];

  let response;
  let retries = 3;
  while (retries--) {
    try {
      if (global.verbose) {
        const startDate = new Date().toISOString();
        log(
          `${startDate}: index ${downloaderIndex}: Starting download ${asset.src}`,
        );
      }
      // eslint-disable-next-line no-await-in-loop
      response = await client.proxyFetch(asset.src);
      break;
    } catch (e) {
      if (retries > 0) {
        // eslint-disable-next-line no-console
        console.error(
          `Error while fetching ${asset.src}. ${e} Retries remaining: ${retries}`,
        );
        // Pause to give the proxy connection a break.
        // eslint-disable-next-line no-await-in-loop,no-loop-func
        await new Promise(resolve => setTimeout(resolve, 2000 - retries * 500));
      } else {
        throw e;
      }
    }
  }

  if (response.ok) {
    files[asset.dest] = {
      path: asset.dest,
      isDrupalAsset: true,
      contents: '',
    };

    const contents = await response.buffer();

    // Store file contents directly on disk
    outputPaths.forEach(outputPath => fs.outputFileSync(outputPath, contents));

    downloadResults.downloadCount++;

    if (global.verbose) {
      const endDate = new Date().toISOString();
      log(
        `${endDate}: index ${downloaderIndex}: Finished downloading ${asset.src}`,
      );
    } else {
      process.stdout.write('.');
      if (!assetsToDownload.length) process.stdout.write('\n');
    }
  } else {
    // For now, not going to fail the build for a missing asset
    // Should get caught by the broken link checker, though
    downloadResults.errorCount++;
    if (global.verbose) {
      log(`Image download failed: ${response.statusText}: ${asset.src}`);
    } else {
      process.stdout.write(chalk.red('.'));
      if (!assetsToDownload.length) process.stdout.write('\n');
    }
  }

  const currentDownloadCount =
    downloadResults.downloadCount + downloadResults.errorCount;

  const allDownloaded = currentDownloadCount === downloadResults.total;

  if (allDownloaded) {
    everythingDownloaded();
  } else if (assetsToDownload.length > 0) {
    downloadFile(
      files,
      options,
      client,
      assetsToDownload,
      downloadResults,
      everythingDownloaded,
      downloaderIndex,
    );
  } else {
    // Some downloads must still be in progress, but there are no files left to begin downloading
    // So, nothing left to do here for this downloader.
  }
}

function downloadDrupalAssets(options) {
  const client = getDrupalClient(options);
  return async (files, metalsmith, done) => {
    const buildPath = path.join('build', options.buildtype);

    const assetsToDownload = Object.entries(files)
      .filter(
        entry =>
          entry[1].isDrupalAsset &&
          !fs.existsSync(path.join(buildPath, entry[1].path)),
      )
      .map(([key, value]) => ({
        src: value.source,
        dest: key,
      }));

    if (assetsToDownload.length) {
      const downloadResults = {
        downloadCount: 0,
        errorCount: 0,
        total: assetsToDownload.length,
      };

      const downloadersCount = 5;

      await new Promise(everythingDownloaded => {
        for (let i = 0; i < downloadersCount; i++) {
          downloadFile(
            files,
            options,
            client,
            assetsToDownload,
            downloadResults,
            everythingDownloaded,
            i,
          );
        }
      });

      log(`Downloaded ${downloadResults.downloadCount} asset(s) from Drupal`);
      if (downloadResults.errorCount) {
        log(
          `${downloadResults.errorCount} error(s) downloading assets from Drupal`,
        );
      }
    }

    done();
  };
}

module.exports = downloadDrupalAssets;
