// Polyfills
import 'regenerator-runtime/runtime'; // For ES2017 await
import { configure } from '@storybook/react';

import './styles.scss';

function loadStories() {
  require('./stories/Inputs.story.jsx');
  require('./stories/EntityData.story.jsx');
}

configure(loadStories, module);
