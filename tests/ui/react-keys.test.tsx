/**
 * Tests for React key warnings - ensures components render arrays without missing key warnings
 */
import { ContactItem } from '@/components/marketing/sections/contact/contact-item';
import { MailIcon } from '@/components/ui/atoms';
import { Skeleton } from '@/components/ui/atoms/skeleton';
import { Slider } from '@/components/ui/atoms/slider';
import { SkeletonSuite } from '@/components/ui/molecules/skeleton-suite';
import { render } from '@testing-library/react';
import * as React from 'react';

describe('React Key Warnings', () => {
  let consoleSpy: any;

  beforeEach(() => {
    // Suppress console.error for clean test output, but track calls
    consoleSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
  });

  afterEach(() => {
    consoleSpy.mockRestore();
  });

  describe('ContactItem', () => {
    it('renders multi-line values without key warnings', () => {
      const multiLineValue = "Line 1\nLine 2\nLine 3";

      render(
        <ContactItem
          icon={<MailIcon />}
          label="Email"
          value={multiLineValue}
        />
      );

      // Should not log React key warnings
      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Each child in a list should have a unique "key" prop')
      );
    });
  });

  describe('Slider', () => {
    it('renders multiple thumbs without key warnings', () => {
      const values = [25, 50, 75];

      render(
        <Slider
          value={values}
          onValueChange={() => {}}
          showTooltips={false}
        />
      );

      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Each child in a list should have a unique "key" prop')
      );
    });
  });

  describe('Skeleton', () => {
    it('renders multiple skeleton rows without key warnings', () => {
      render(<Skeleton rows={3} />);

      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Each child in a list should have a unique "key" prop')
      );
    });
  });

  describe('SkeletonSuite', () => {
    it('renders skeleton grid without key warnings', () => {
      render(<SkeletonSuite count={4} rows={2} columns={3} />);

      expect(consoleSpy).not.toHaveBeenCalledWith(
        expect.stringContaining('Each child in a list should have a unique "key" prop')
      );
    });
  });

});



