import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const read = (file) => fs.readFileSync(path.join(root, file), 'utf8');
const assert = (condition, message) => { if (!condition) throw new Error(message); };

const html = read('docs/founder-os/index.html');
const controller = read('docs/founder-os/js/founder-home-functionality.js');
const availability = read('docs/founder-os/js/interaction-availability.js');
const manager = read('docs/founder-os/js/workspace-manager.js');

assert(html.includes('founder-home-functionality.css?v=founder-ux-021'), 'Functional readiness stylesheet is not loaded.');
assert(html.includes('founder-home-functionality.js?v=founder-ux-021'), 'Functional readiness controller is not loaded.');
assert(html.indexOf('founder-home-functionality.js') > html.indexOf('interaction-availability.js'), 'Functional readiness controller must load after availability enforcement.');
assert(controller.includes('data-open-founder-settings'), 'Founder settings route is missing.');
assert(controller.includes('data-launch-action="health"'), 'Workspace Health route is missing.');
assert(controller.includes('data-portfolio-empty'), 'Portfolio empty state is missing.');
assert(controller.includes('data-carousel-direction'), 'Carousel step controller is missing.');
assert(controller.includes('Founder OS Gateway is unavailable'), 'Gateway-dependent action protection is missing.');
assert(controller.includes('Remove Damaged Saved Setup'), 'Damaged draft recovery is missing.');
assert(availability.includes('refreshWorkspaceOpenActions'), 'Unavailable workspace routes are not protected.');
assert(manager.includes('data-workspace-settings'), 'Workspace Settings must remain inside active workspace pages.');
assert(!manager.includes('insertAdjacentHTML(\'beforebegin\''), 'Workspace management must not be injected into Home carousel cards.');

console.log('Founder OS Home functional readiness validation passed.');