(function() {
  HP.VideoPlayer.DashSegmentIndex = HP.BaseClass.extend(
  /** @lends HP.VideoPlayer.DashSegmentIndex.prototype */
  {
    /**
     * The total number of segments stored in the index. When '_isCapped' is
     * set, the offset and start time at the index equal to the count (i.e. last
     * seg num + 1) are valid and point to EOS.
     * @type {Number}
     */
    _count: 0,

    /**
     * The absolute byte offsets from the start of the resource to the start of
     * the numbered segment. This value (and _startTimes) grow by doubling for
     * efficient incremental accumulation of new index entries. No Int64 type so
     * these integers are stored in Float64s.
     * @type {Float64Array}
     */
    _offsets: null,

    /**
     * The start time of the indexed segment.
     * @type {Float32Array}
     */
    _startTimes: null,

    /**
     * Whether this index is "capped" - meaning that the offset and start time
     * after the last segment point to EOS.
     * @type {boolean}
     */
    _isCapped: false,

    /**
     * A container for references to (sub)segments. 
     * References are guaranteed to be monotonic and contiguous by the underlying file formats (for now).
     * @extends {HP.BaseClass}
     * @constructs
     */
    constructor: function() {
      this._count = 0;
      this._offsets = new Float64Array(128);
      this._startTimes = new Float32Array(128);
      this._isCapped = false;
    },

    /**
     * Returns the starting byte offset of a segment.
     * @param {Number} segNum Segment number.
     * @return {Number} Start time.
     */
    getOffset: function(segNum) {
      return this._offsets[segNum];
    },

    /**
     * Returns the start time of a segment.
     * @param {Number} segNum Segment number.
     * @return {Number} Start time.
     */
    getStartTime: function(segNum) {
      return this._startTimes[segNum];
    },

    /**
     * Returns the duration of a segment, or -1 if duration is unknown.
     * @param {Number} segNum Segment number.
     * @return {Number} Duration.
     */
    getDuration: function(segNum) {
      if (segNum + 1 < this._count || this._isCapped) {
        return this._startTimes[segNum + 1] - this._startTimes[segNum];
      }
      return -1;
    },

    /**
     * Returns the length of a segment, or -1 if length is unknown.
     * @param {Number} segNum Segment number.
     * @return {Number} Byte length.
     */
    getByteLength: function(segNum) {
      if (segNum + 1 < this._count || this._isCapped) {
        return this._offsets[segNum + 1] - this._offsets[segNum];
      }
      return -1;
    },

    /**
     * Returns the number of segments in this index.
     * @return {Number} Segment count.
     */
    getCount: function() {
      return this._count;
    },

    /**
     * Returns the total duration of the media in the index.
     * @return {Number} Total duration.
     */
    getTotalDuration: function() {
      return this._isCapped ? this._startTimes[this._count] : -1;
    },

    /**
     * Returns the total length of the media in the index.
     * @return {Number} Total byte length.
     */
    getTotalByteLength: function() {
      return this._isCapped ? this._offsets[this._count] : -1;
    },

    /**
     * Returns the segment number which begins no later than the provided time.
     * @param {Number} time Time to search for.
     * @return {Number} Segment number.
     */
    findForTime: function(time) {
      var idx = this._count - 1;
      for (var i = 0; i < this._count; i++) {
        if (this._startTimes[i] > time) {
          idx = i - 1;
          break;
        }
      }
      return idx;
    },

    /**
     * Resizes the segment index to include more places for media information.
     * Adding segments invokes this automatically, but if the segment count is known
     * performance can be improved.
     * @param {Number} newSize New size.
     */
    _resize: function(newSize) {
      // Always add a bit extra to avoid expensive resizes when capping
      newSize += 2;

      var offsets = this._offsets;
      this._offsets = new Float64Array(newSize + 1);
      var startTimes = this._startTimes;
      this._startTimes = new Float32Array(newSize + 1);
      for (var i = 0; i < this._count + 1; i++) {
        this._offsets[i] = offsets[i];
        this._startTimes[i] = startTimes[i];
      }
    },

    /**
     * Check whether we need to expand, do it if we do.
     */
    _checkExpand: function() {
      if (this._offsets.length < this._count + 1) {
        this._resize(this._offsets.length * 2);
      }
    },

    /**
     * Indicates that this segment index will be grown in "capped" mode, where a
     * segment's extents are communicated explicitly.
     * @param {Number} offset Byte offset of first media segment.
     * @param {Number} startTime Start time of first media segment.
     */
    _setFirstSegmentStart: function(offset, startTime) {
      this._offsets[0] = offset;
      this._startTimes[0] = startTime;
      this._isCapped = true;
    },

    /**
     * Grows the index in in "capped" mode by providing a new extent.
     * @param {Number} length Byte length of new media segment.
     * @param {Number} duration Time length of new media segment.
     */
    _addSegmentBySize: function(length, duration) {
      this._count++;
      this._checkExpand();
      this._offsets[this._count] = this._offsets[this._count - 1] + length;
      this._startTimes[this._count] = this._startTimes[this._count - 1] + duration;
    },

    /**
     * Adds a new segment (when not in "capped" mode) by specifying start info.
     * @param {Number} offset Byte offset of new media segment.
     * @param {Number} startTime Start time of new media segment.
     */
    _addSegmentByStart: function(offset, startTime) {
      this._checkExpand();
      this._offsets[this._count] = offset;
      this._startTimes[this._count] = startTime;
      this._count++;
    },

    /**
     * Convert an uncapped index (which doesn't know the extent of the last segment)
     * to a capped one by providing overall file details. This is likely to be
     * slightly wrong, as the last segment will also catch metadata at the end of
     * the file, but the effects are hopefully not calamitous since there's another
     * parser underneath us.
     * @param {Number} duration Duration of the file.
     * @param {Number} length Byte length of the file.
     */
    _cap: function(duration, length) {
      this._checkExpand();
      this._isCapped = true;
      this._startTimes[this._count] = duration;
      this._offsets[this._count] = length;
    },

    /**
     * Turn an ArrayBuffer (that is a sidx atom) into a segment index.
     * It is assumed that the sidx atom starts at byte 0.
     *
     * @param {ArrayBuffer} ab The ArrayBuffer of a sidx atom.
     * @param {Number} sidxStart The offset of the start of the sidx atom.
     * @see http://www.iso.org/iso/catalogue_detail.htm?csnumber=61988
     *     (ISO/IEC 14496-12:2012 section 8.16.3)
     */
    parseSidx: function(ab, sidxStart) {
      var d = new DataView(ab);
      var pos = 0;

      var sidxEnd = d.getUint32(0, false);

      var version = d.getUint8(pos + 8);
      pos += 12;

      // Skip reference_ID(32)

      var timescale = d.getUint32(pos + 4, false);
      pos += 8;

      var earliestPts;
      var firstOffset;
      if (version == 0) {
        earliestPts = d.getUint32(pos, false);
        firstOffset = d.getUint32(pos + 4, false);
        pos += 8;
      } else {
        earliestPts =
            (d.getUint32(pos, false) << 32) + d.getUint32(pos + 4, false);
        firstOffset =
            (d.getUint32(pos + 8, false) << 32) + d.getUint32(pos + 12, false);
        pos += 16;
      }

      firstOffset += sidxEnd + sidxStart;
      this._setFirstSegmentStart(firstOffset, earliestPts);

      // Skip reserved(16)
      var referenceCount = d.getUint16(pos + 2, false);
      pos += 4;

      for (var i = 0; i < referenceCount; i++) {
        var length = d.getUint32(pos, false);
        var duration = d.getUint32(pos + 4, false);
        pos += 12;
        this._addSegmentBySize(length, duration / timescale);
      }
    }
  })
}).call(this);