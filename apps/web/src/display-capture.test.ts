import {expect,it} from 'vitest';
import {displayCaptureAvailability,displayCaptureFailure} from './display-capture.js';
it('absence of browser capture never becomes a permission denial or a device support claim',()=>{
 expect(displayCaptureAvailability({secure:true,hasApi:false})).toBe('unsupported');
 expect(displayCaptureAvailability({secure:false,hasApi:false})).toBe('insecure');
 expect(displayCaptureAvailability({secure:true,hasApi:true})).toBe('available');
 expect(displayCaptureFailure(new DOMException('source','NotReadableError'))).toBe('capture_blocked');
 expect(displayCaptureFailure(new DOMException('source','NotSupportedError'))).toBe('unsupported');
 expect(displayCaptureFailure(new DOMException('source','NotAllowedError'))).toBe('denied');
});
