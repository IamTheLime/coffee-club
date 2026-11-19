import {test} from 'node:test';
import assert from 'node:assert/strict';
import {coordinatesFromMapLink} from '../server/map-links.mjs';
test('should use the place pin rather than the map camera centre',()=>{
 assert.deepEqual(coordinatesFromMapLink('https://www.google.com/maps/place/Cafe/@50,-1,17z/data=!3d51.5327752!4d-0.0985187'),{lat:51.5327752,lon:-.0985187});
 assert.equal(coordinatesFromMapLink('https://www.google.com/maps/@50,-1,17z'),null);
 assert.deepEqual(coordinatesFromMapLink('https://www.google.com/maps/search/?api=1&query=51.5,-0.1'),{lat:51.5,lon:-.1});
});
test('should reject malformed coordinates and untrusted map destinations',()=>{
 for(const u of ['https://evil.example/maps/data=!3d51!4d0','http://www.google.com/maps/data=!3d51!4d0','https://www.google.com/maps/data=!3d99!4d0','https://user@www.google.com/maps/data=!3d51!4d0'])assert.equal(coordinatesFromMapLink(u),null);
});
