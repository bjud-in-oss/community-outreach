import { EmpatibrygganDemo } from '../../components/communication/empatibryggan-demo';

/**
 * Empatibryggan Demo Page
 * 
 * Showcases the communication coaching functionality
 * implementing Requirements 22.1-22.4
 */
export default function EmpatibrygganDemoPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <EmpatibrygganDemo />
    </div>
  );
}

export const metadata = {
  title: 'Empatibryggan Communication Coach - Demo',
  description: 'Experience intelligent communication coaching that helps you send thoughtful, effective messages while protecting privacy.',
};