'use strict';

var gulp = require('gulp'),
    one = require('one-gulp');

one.init(gulp, {});

one.unlink(one.transforms.sortCssByDepth).from(one.transforms.injectDev);
one.unlink(one.transforms.sortJsByDepth).from(one.transforms.injectDev);
one.remove(one.transforms.injectDev);
one.remove(one.transforms.injectProd);
