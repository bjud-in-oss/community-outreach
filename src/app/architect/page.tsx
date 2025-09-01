'use client';

import React, { useState } from 'react';
import { ArchitectView } from '@/components/architect';
import { UserRole } from '@/types';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

/**
 * Architect View Demo Page
 * Demonstrates the Architect View with role switching for testing
 */
export default function ArchitectPage() {
  const [userRole, setUserRole] = useState<UserRole>('senior');
  const [accessDeniedCount, setAccessDeniedCount] = useState(0);

  const handleAccessDenied = () => {
    setAccessDeniedCount(prev => prev + 1);
  };

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Demo Controls */}
      <div className="bg-white border-b border-gray-200 p-4">
        <div className="max-w-7xl mx-auto">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-bold text-gray-900">
                Architect View Demo
              </h1>
              <p className="text-gray-600">
                Switch user roles to test access control
              </p>
            </div>
            
            <div className="flex items-center space-x-4">
              <div className="text-sm">
                <span className="font-medium">Current Role:</span>
                <span className={`ml-2 px-2 py-1 rounded text-xs font-medium ${
                  userRole === 'architect' 
                    ? 'bg-green-100 text-green-800' 
                    : 'bg-red-100 text-red-800'
                }`}>
                  {userRole}
                </span>
              </div>
              
              <Button
                variant={userRole === 'senior' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setUserRole('senior')}
              >
                Senior User
              </Button>
              
              <Button
                variant={userRole === 'architect' ? 'default' : 'outline'}
                size="sm"
                onClick={() => setUserRole('architect')}
              >
                Architect
              </Button>
            </div>
          </div>
          
          {accessDeniedCount > 0 && (
            <div className="mt-4">
              <Card className="border-yellow-200 bg-yellow-50">
                <CardContent className="p-4">
                  <p className="text-sm text-yellow-800">
                    Access denied {accessDeniedCount} time(s). 
                    Switch to "Architect" role to access the control room.
                  </p>
                </CardContent>
              </Card>
            </div>
          )}
        </div>
      </div>

      {/* Architect View */}
      <ArchitectView
        userRole={userRole}
        fullScreen={true}
        onAccessDenied={handleAccessDenied}
      />
    </div>
  );
}